using DC.BLL.Dtos.ConsultantReviews;
using DC.BLL.Interfaces;
using DC.DAL.Data;
using DC.DAL.Models;

using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class ConsultantReviewService : IConsultantReviewService
{
    private readonly AppDbContext _db;
    private readonly AuditHelper _audit;
    private readonly IEmailService _email;
    private readonly IEmailTemplateService _emailTemplate;

    public ConsultantReviewService(
        AppDbContext db,
        AuditHelper audit,
        IEmailService email,
        IEmailTemplateService emailTemplate)
    {
        _db = db;
        _audit = audit;
        _email = email;
        _emailTemplate = emailTemplate;
    }

    public async Task<List<ConsultantReviewDto>> GetAllAsync() =>
        await _db.ConsultantReviews.AsNoTracking()
            .OrderBy(x => x.ReviewId)
            .Select(x => Map(x))
            .ToListAsync();

    public async Task<ConsultantReviewDto?> GetByIdAsync(int id)
    {
        var e = await _db.ConsultantReviews.AsNoTracking()
            .FirstOrDefaultAsync(x => x.ReviewId == id);
        return e == null ? null : Map(e);
    }

    public async Task<List<ConsultantReviewDto>> GetByVersionAsync(int versionId) =>
        await _db.ConsultantReviews.AsNoTracking()
            .Where(x => x.VersionId == versionId)
            .OrderBy(x => x.ReviewId)
            .Select(x => Map(x))
            .ToListAsync();

    public async Task<ConsultantReviewDto> CreateAsync(CreateConsultantReviewDto dto)
    {
        return await SubmitReviewAsync(new SubmitReviewDto
        {
            VersionId = dto.VersionId,
            ConsultantUserId = dto.ConsultantUserId,
            Rating = dto.Rating,
            Comments = dto.Comments
        });
    }

    /// <summary>
    /// Authoritative Rating rules:
    /// A → Approved              → FINAL (no new version)
    /// B → ApprovedWithComments  → FINAL (no new version)
    /// C → RequiresRevision      → ONLY case that allows new version
    /// D → Rejected              → FINAL (must create NEW document, not new version)
    /// </summary>
    public async Task<ConsultantReviewDto> SubmitReviewAsync(SubmitReviewDto dto)
    {
        var version = await _db.DocumentVersions
            .Include(v => v.Document)
            .FirstOrDefaultAsync(v => v.VersionId == dto.VersionId)
            ?? throw new KeyNotFoundException("Document version not found.");

        var document = version.Document;

        // Only current version can be reviewed
        if (version.VersionNumber != document.CurrentVersionNumber)
            throw new InvalidOperationException("Only the current document version can be reviewed.");

        if (version.ReviewStatus != DocumentStatuses.PendingReview)
            throw new InvalidOperationException("This version is not pending review.");

        if (document.Status != DocumentStatuses.PendingReview)
            throw new InvalidOperationException("Document is not pending review.");

        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == dto.ConsultantUserId)
            ?? throw new KeyNotFoundException("User not found.");

        // Who may review:
        // - Super Admin: always
        // - Consultant: only if assigned to this contract
        // - Engineer: only if assigned to this contract
        var isSuperAdmin = user.Role == Roles.SuperAdmin;
        var isConsultant = user.Role == Roles.Consultant;
        var isEngineer = user.Role == Roles.ToEngineer;

        if (!isSuperAdmin && !isConsultant && !isEngineer)
            throw new InvalidOperationException(
                "Only Super Admin, assigned Consultant, or assigned Engineer can submit a review.");

        if (!isSuperAdmin)
        {
            var assignedAsConsultant = isConsultant && await _db.ContractConsultants.AnyAsync(x =>
                x.ContractId == document.ContractId && x.UserId == dto.ConsultantUserId);

            var assignedAsEngineer = isEngineer && await _db.ContractEngineers.AnyAsync(x =>
                x.ContractId == document.ContractId && x.UserId == dto.ConsultantUserId);

            if (!assignedAsConsultant && !assignedAsEngineer)
                throw new InvalidOperationException(
                    "You are not assigned to this contract and cannot submit a review.");
        }

        var rating = dto.Rating.Trim().ToUpperInvariant();
        if (rating is not (Ratings.A or Ratings.B or Ratings.C or Ratings.D))
            throw new InvalidOperationException("Rating must be A, B, C, or D.");

        // Matrix:
        // A → Approved (FINAL)
        // B → ApprovedWithComments (FINAL)
        // C → RequiresRevision (allows Version 02+)
        // D → Rejected (FINAL — engineer must create a NEW document)
        var newStatus = rating switch
        {
            Ratings.A => DocumentStatuses.Approved,
            Ratings.B => DocumentStatuses.ApprovedWithComments,
            Ratings.C => DocumentStatuses.RequiresRevision,
            Ratings.D => DocumentStatuses.Rejected,
            _ => DocumentStatuses.PendingReview
        };

        var review = new ConsultantReview
        {
            VersionId = dto.VersionId,
            ConsultantUserId = dto.ConsultantUserId,
            Rating = rating,
            Comments = dto.Comments,
            ReviewDate = DateTime.UtcNow
        };

        _db.ConsultantReviews.Add(review);

        // Update version + document status (history preserved)
        version.ReviewStatus = newStatus;
        document.Status = newStatus;
        document.ReplyDate = DateTime.UtcNow;
        document.UpdatedAt = DateTime.UtcNow;

        // Notify the engineer who created/owns the document
        var resultMessage = rating switch
        {
            Ratings.A => "Document Approved.",
            Ratings.B => "Document Approved With Comments.",
            Ratings.C => "Document Requires Revision. You may upload a new version.",
            Ratings.D => "Document Rejected. Create a new document if needed.",
            _ => "Document reviewed."
        };

        _db.Notifications.Add(new Notification
        {
            UserId = document.CreatedByUserId,
            Title = $"Review result: {rating} — {document.DocumentNumber}",
            Message = resultMessage,
            IsRead = false,
            ContractId = document.ContractId,
            DocumentId = document.DocumentId,
            VersionId = version.VersionId,
            Type = "ReviewResult",
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        // Email notification to the engineer (non-blocking)
        await SendReviewEmailAsync(document, rating, dto.Comments);

        await _audit.LogAsync(
            dto.ConsultantUserId,
            "Review",
            "ConsultantReview",
            review.ReviewId,
            $"Rating {rating} on version {version.VersionId} → {newStatus}");

        return Map(review);
    }

    private async Task SendReviewEmailAsync(Document document, string rating, string? comments)
    {
        try
        {
            // Creator engineer + all active engineers assigned to the contract
            var emails = await (
                from ce in _db.ContractEngineers
                join u in _db.Users on ce.UserId equals u.UserId
                where ce.ContractId == document.ContractId
                      && u.IsActive
                      && u.Email != null
                      && u.Email != ""
                select u.Email
            ).ToListAsync();

            // Always include document creator if active with email
            var creator = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == document.CreatedByUserId);
            if (creator != null && creator.IsActive && !string.IsNullOrWhiteSpace(creator.Email))
                emails.Add(creator.Email);

            emails = emails
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .Select(e => e.Trim())
                .Where(e => !e.EndsWith("@dc.com", StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (emails.Count == 0) return;

            var msg = _emailTemplate.BuildConsultantReview(
                emails,
                document.DocumentNumber,
                document.Title,
                rating,
                comments,
                document.DocumentId);
            await _email.SendAsync(msg);
        }
        catch
        {
            // Swallow — email must never break review workflow
        }
    }

    public async Task<ConsultantReviewDto?> UpdateAsync(int id, UpdateConsultantReviewDto dto)
    {
        // Business rule: do not allow changing review results after submit
        throw new InvalidOperationException("Review results cannot be modified after submission.");
    }

    public async Task DeleteAsync(int id)
    {
        // Keep history — do not delete reviews in normal workflow
        throw new InvalidOperationException("Reviews cannot be deleted (history must be preserved).");
    }

    private static ConsultantReviewDto Map(ConsultantReview r) => new()
    {
        ReviewId = r.ReviewId,
        VersionId = r.VersionId,
        ConsultantUserId = r.ConsultantUserId,
        Rating = r.Rating,
        Comments = r.Comments,
        ReviewDate = r.ReviewDate
    };
}
