using DC.BLL.Dtos.Documents;
using DC.BLL.Dtos.DocumentVersions;
using DC.BLL.Interfaces;

using DC.DAL.Data;
using DC.DAL.Models;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class DocumentService : IDocumentService
{
    private readonly AppDbContext _db;
    private readonly DocumentNumberingService _numbering;
    private readonly IWebHostEnvironment _env;
    private readonly AuditHelper _audit;
    private readonly IEmailService _email;
    private readonly IEmailTemplateService _emailTemplate;

    public DocumentService(
        AppDbContext db,
        DocumentNumberingService numbering,
        IWebHostEnvironment env,
        AuditHelper audit,
        IEmailService email,
        IEmailTemplateService emailTemplate)
    {
        _db = db;
        _numbering = numbering;
        _env = env;
        _audit = audit;
        _email = email;
        _emailTemplate = emailTemplate;
    }

    public async Task<List<DocumentDto>> GetAllAsync()
    {
        await AutoRejectAllOverdueAsync();
        return await _db.Documents.AsNoTracking()
            .OrderBy(x => x.DocumentId)
            .Select(x => Map(x))
            .ToListAsync();
    }

    public async Task<DocumentDto?> GetByIdAsync(int id)
    {
        var e = await _db.Documents.FirstOrDefaultAsync(x => x.DocumentId == id);
        if (e == null) return null;
        await ApplyOverdueRejectionIfNeededAsync(e);
        return Map(e);
    }

    public async Task<List<DocumentDto>> GetByContractAsync(int contractId) =>
        await _db.Documents.AsNoTracking()
            .Where(x => x.ContractId == contractId)
            .OrderBy(x => x.DocumentId)
            .Select(x => Map(x))
            .ToListAsync();

    public async Task<DocumentDto> CreateAsync(CreateDocumentDto dto)
    {
        // Prefer SubmitAsync with file for full workflow.
        // This keeps basic create with auto numbering + no file.
        await ValidateEngineerCanSubmitAsync(dto.ContractId, dto.CreatedByUserId);

        if (!await _db.DocumentTypes.AnyAsync(x => x.TypeId == dto.DocumentTypeId))
            throw new KeyNotFoundException("Document type not found.");
        if (!await _db.DocumentCategories.AnyAsync(x => x.CategoryId == dto.DocumentCategoryId))
            throw new KeyNotFoundException("Document category not found.");
        if (!await _db.DocumentTypeCategories.AnyAsync(x =>
                x.DocumentTypeId == dto.DocumentTypeId && x.DocumentCategoryId == dto.DocumentCategoryId))
            throw new InvalidOperationException(
                "Selected category does not belong to the selected document type.");
        if (dto.ContractorId.HasValue &&
            !await _db.Contractors.AnyAsync(x => x.ContractorId == dto.ContractorId.Value))
            throw new KeyNotFoundException("Contractor not found.");

        var (serial, docNumber) = await _numbering.GenerateAsync(
            dto.ContractId, dto.DocumentTypeId, dto.DocumentCategoryId, dto.ContractorId);

        var e = new Document
        {
            DocumentNumber = docNumber,
            ContractId = dto.ContractId,
            DocumentTypeId = dto.DocumentTypeId,
            DocumentCategoryId = dto.DocumentCategoryId,
            ContractorId = dto.ContractorId,
            SerialNumber = serial,
            Status = DocumentStatuses.PendingReview,
            Title = dto.Title,
            Description = dto.Description,
            CreatedByUserId = dto.CreatedByUserId,
            CurrentVersionNumber = "01",
            CreatedAt = DateTime.UtcNow,
            IssueDate = DateTime.UtcNow.Date,
            IssuedByUserId = dto.CreatedByUserId
        };

        _db.Documents.Add(e);
        await _db.SaveChangesAsync();
        return Map(e);
    }

    /// <summary>
    /// Engineer submits a NEW document:
    /// - validates assignment
    /// - auto DocumentNumber + Serial
    /// - creates Version 01
    /// - Status = PendingReview
    /// - notifies assigned consultants
    /// </summary>
    public async Task<DocumentDto> SubmitAsync(SubmitDocumentDto dto, IFormFile file)
    {
        FileValidationHelper.Validate(file);

        await ValidateEngineerCanSubmitAsync(dto.ContractId, dto.CreatedByUserId);

        if (!await _db.DocumentTypes.AnyAsync(x => x.TypeId == dto.DocumentTypeId))
            throw new KeyNotFoundException("Document type not found.");
        if (!await _db.DocumentCategories.AnyAsync(x => x.CategoryId == dto.DocumentCategoryId))
            throw new KeyNotFoundException("Document category not found.");
        if (!await _db.DocumentTypeCategories.AnyAsync(x =>
                x.DocumentTypeId == dto.DocumentTypeId && x.DocumentCategoryId == dto.DocumentCategoryId))
            throw new InvalidOperationException(
                "Selected category does not belong to the selected document type.");
        if (dto.ContractorId.HasValue &&
            !await _db.Contractors.AnyAsync(x => x.ContractorId == dto.ContractorId.Value))
            throw new KeyNotFoundException("Contractor not found.");

        var (serial, docNumber) = await _numbering.GenerateAsync(
            dto.ContractId, dto.DocumentTypeId, dto.DocumentCategoryId, dto.ContractorId);

        var document = new Document
        {
            DocumentNumber = docNumber,
            ContractId = dto.ContractId,
            DocumentTypeId = dto.DocumentTypeId,
            DocumentCategoryId = dto.DocumentCategoryId,
            ContractorId = dto.ContractorId,
            SerialNumber = serial,
            Status = DocumentStatuses.PendingReview,
            Title = dto.Title,
            Description = dto.Description,
            CreatedByUserId = dto.CreatedByUserId,
            CurrentVersionNumber = "01",
            CreatedAt = DateTime.UtcNow,
            InspectionRef = dto.InspectionRef,
            IssueDate = dto.IssueDate ?? DateTime.UtcNow.Date,
            InspectionDate = dto.InspectionDate,
            DueDate = dto.DueDate,
            Zone = dto.Zone,
            Building = dto.Building,
            Axis = dto.Axis,
            IssuedByUserId = dto.IssuedByUserId ?? dto.CreatedByUserId,
            DocumentControllerUserId = dto.DocumentControllerUserId,
            Remarks = dto.Remarks
        };

        _db.Documents.Add(document);
        await _db.SaveChangesAsync();

        var saved = await SaveFileAsync(file, document.DocumentId, "01");

        var version = new DocumentVersion
        {
            DocumentId = document.DocumentId,
            VersionNumber = "01",
            FileName = saved.FileName,
            FilePath = saved.FilePath,
            FileContentType = saved.ContentType,
            FileSizeBytes = saved.Size,
            UploadedByUserId = dto.CreatedByUserId,
            UploadedAt = DateTime.UtcNow,
            ReviewStatus = DocumentStatuses.PendingReview,
            Notes = dto.Notes
        };

        _db.DocumentVersions.Add(version);
        await _db.SaveChangesAsync();

        // Notify consultants assigned to this contract
        await NotifyConsultantsAsync(
            document.ContractId,
            document.DocumentId,
            version.VersionId,
            $"New document submitted: {document.DocumentNumber}",
            "A new document/version is waiting for your review.");

        // Email notification (non-blocking for workflow)
        await SendDocumentSubmittedEmailAsync(document);

        await _audit.LogAsync(
            dto.CreatedByUserId,
            "Submit",
            "Document",
            document.DocumentId,
            $"Submitted {document.DocumentNumber} version 01");

        return Map(document);
    }

    /// <summary>
    /// Engineer uploads a NEW version ONLY when Status = RequiresRevision (Rating C).
    /// A / B / D are FINAL — no new version allowed.
    /// Old versions are kept in history.
    /// </summary>
    public async Task<DocumentVersionDto> UploadNewVersionAsync(UploadVersionDto dto, IFormFile file)
    {
        FileValidationHelper.Validate(file);

        var document = await _db.Documents.FirstOrDefaultAsync(x => x.DocumentId == dto.DocumentId)
            ?? throw new KeyNotFoundException("Document not found.");

        // ONLY Rating C → RequiresRevision allows a new version
        if (document.Status != DocumentStatuses.RequiresRevision)
        {
            throw new InvalidOperationException(
                "New version is only allowed when the latest review is Rating C (RequiresRevision). " +
                "A, B, and D are final.");
        }

        await ValidateEngineerCanSubmitAsync(document.ContractId, dto.UploadedByUserId);

        var nextVersion = DocumentNumberingService.NextVersionNumber(document.CurrentVersionNumber);

        var exists = await _db.DocumentVersions.AnyAsync(x =>
            x.DocumentId == dto.DocumentId && x.VersionNumber == nextVersion);
        if (exists)
            throw new InvalidOperationException("Version number already exists for this document.");

        var saved = await SaveFileAsync(file, document.DocumentId, nextVersion);

        var version = new DocumentVersion
        {
            DocumentId = document.DocumentId,
            VersionNumber = nextVersion,
            FileName = saved.FileName,
            FilePath = saved.FilePath,
            FileContentType = saved.ContentType,
            FileSizeBytes = saved.Size,
            UploadedByUserId = dto.UploadedByUserId,
            UploadedAt = DateTime.UtcNow,
            ReviewStatus = DocumentStatuses.PendingReview,
            Notes = dto.Notes
        };

        _db.DocumentVersions.Add(version);

        document.CurrentVersionNumber = nextVersion;
        document.Status = DocumentStatuses.PendingReview;
        document.UpdatedAt = DateTime.UtcNow;

        // Same Serial — only Revision part of DocumentNumber changes
        document.DocumentNumber = await _numbering.BuildForRevisionAsync(
            document.ContractId,
            document.DocumentTypeId,
            document.DocumentCategoryId,
            document.ContractorId,
            document.SerialNumber,
            nextVersion);

        await _db.SaveChangesAsync();

        await NotifyConsultantsAsync(
            document.ContractId,
            document.DocumentId,
            version.VersionId,
            $"Revised document submitted: {document.DocumentNumber}",
            $"Version {nextVersion} is waiting for your review.");

        // Email notification (non-blocking for workflow)
        await SendRevisionUploadedEmailAsync(document, nextVersion);

        await _audit.LogAsync(
            dto.UploadedByUserId,
            "UploadVersion",
            "DocumentVersion",
            version.VersionId,
            $"Uploaded version {nextVersion} for document {document.DocumentNumber}");

        return new DocumentVersionDto
        {
            VersionId = version.VersionId,
            DocumentId = version.DocumentId,
            VersionNumber = version.VersionNumber,
            FileName = version.FileName,
            FilePath = version.FilePath,
            FileContentType = version.FileContentType,
            FileSizeBytes = version.FileSizeBytes,
            UploadedByUserId = version.UploadedByUserId,
            UploadedAt = version.UploadedAt,
            ReviewStatus = version.ReviewStatus,
            Notes = version.Notes
        };
    }

    public async Task<DocumentDto?> UpdateAsync(int id, UpdateDocumentDto dto)
    {
        var e = await _db.Documents.FirstOrDefaultAsync(x => x.DocumentId == id);
        if (e == null) return null;

        // Do not allow status/version manipulation via generic update for workflow safety
        e.Title = dto.Title;
        e.Description = dto.Description;
        e.InspectionRef = dto.InspectionRef;
        e.IssueDate = dto.IssueDate;
        e.InspectionDate = dto.InspectionDate;
        e.DueDate = dto.DueDate;
        e.ReplyDate = dto.ReplyDate;
        e.Zone = dto.Zone;
        e.Building = dto.Building;
        e.Axis = dto.Axis;
        e.IssuedByUserId = dto.IssuedByUserId;
        e.DocumentControllerUserId = dto.DocumentControllerUserId;
        e.Remarks = dto.Remarks;
        e.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(e);
    }

    public async Task DeleteAsync(int id)
    {
        var e = await _db.Documents.FirstOrDefaultAsync(x => x.DocumentId == id)
            ?? throw new KeyNotFoundException("Document not found.");
        _db.Documents.Remove(e);
        await _db.SaveChangesAsync();
    }

    private async Task ValidateEngineerCanSubmitAsync(int contractId, int userId)
    {
        if (!await _db.Contracts.AnyAsync(x => x.ContractId == contractId))
            throw new KeyNotFoundException("Contract not found.");

        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (user.Role == Roles.SuperAdmin)
            return;

        if (user.Role != Roles.ToEngineer)
            throw new InvalidOperationException("Only a Technical Office Engineer can submit documents.");

        var assigned = await _db.ContractEngineers.AnyAsync(x =>
            x.ContractId == contractId && x.UserId == userId);

        if (!assigned)
            throw new InvalidOperationException("Engineer is not assigned to this contract.");
    }

    private async Task NotifyConsultantsAsync(
        int contractId, int documentId, int versionId, string title, string message)
    {
        var consultantIds = await _db.ContractConsultants
            .Where(x => x.ContractId == contractId)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync();

        foreach (var consultantId in consultantIds)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = consultantId,
                Title = title,
                Message = message,
                IsRead = false,
                ContractId = contractId,
                DocumentId = documentId,
                VersionId = versionId,
                Type = "DocumentSubmitted",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (consultantIds.Count > 0)
            await _db.SaveChangesAsync();
    }


    private async Task SendDocumentSubmittedEmailAsync(Document document)
    {
        try
        {
            // Everyone assigned on this contract OR any contract under the same project
            var emails = await GetActiveProjectMemberEmailsAsync(document.ContractId);
            if (emails.Count == 0) return;

            var msg = _emailTemplate.BuildDocumentSubmitted(
                emails,
                document.DocumentNumber,
                document.Title,
                document.DocumentId);
            await _email.SendAsync(msg);
        }
        catch
        {
            // Swallow — email must never break document workflow
        }
    }

    private async Task SendRevisionUploadedEmailAsync(Document document, string versionNumber)
    {
        try
        {
            var emails = await GetActiveProjectMemberEmailsAsync(document.ContractId);
            if (emails.Count == 0) return;

            var msg = _emailTemplate.BuildRevisionUploaded(
                emails,
                document.DocumentNumber,
                document.Title,
                versionNumber,
                document.DocumentId);
            await _email.SendAsync(msg);
        }
        catch
        {
            // Swallow — email must never break document workflow
        }
    }

    /// <summary>
    /// Active Engineers + Consultants assigned to this contract OR any other contract
    /// under the same project, with a real email (skips placeholder @dc.com seed addresses).
    /// </summary>
    private async Task<List<string>> GetActiveProjectMemberEmailsAsync(int contractId)
    {
        var projectId = await _db.Contracts
            .Where(c => c.ContractId == contractId)
            .Select(c => c.ProjectId)
            .FirstOrDefaultAsync();

        if (projectId == 0)
            return new List<string>();

        // All contracts under the same project
        var contractIds = await _db.Contracts
            .Where(c => c.ProjectId == projectId)
            .Select(c => c.ContractId)
            .ToListAsync();

        var engineerEmails =
            from ce in _db.ContractEngineers
            join u in _db.Users on ce.UserId equals u.UserId
            where contractIds.Contains(ce.ContractId)
                  && u.IsActive
                  && u.Email != null
                  && u.Email != ""
            select u.Email;

        var consultantEmails =
            from cc in _db.ContractConsultants
            join u in _db.Users on cc.UserId equals u.UserId
            where contractIds.Contains(cc.ContractId)
                  && u.IsActive
                  && u.Email != null
                  && u.Email != ""
            select u.Email;

        // Only the Super Admin who created this project (not all Super Admins)
        var creatorEmail =
            from c in _db.Contracts
            where c.ContractId == contractId
            join pr in _db.Projects on c.ProjectId equals pr.ProjectId
            where pr.CreatedByUserId != null
            join u in _db.Users on pr.CreatedByUserId equals u.UserId
            where u.IsActive
                  && u.Email != null
                  && u.Email != ""
            select u.Email;

        var emails = await engineerEmails
            .Union(consultantEmails)
            .Union(creatorEmail)
            .Distinct()
            .ToListAsync();

        // Skip seed/placeholder addresses that bounce (e.g. *@dc.com)
        return emails
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Select(e => e.Trim())
            .Where(e => !e.EndsWith("@dc.com", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private async Task<(string FileName, string FilePath, string ContentType, long Size)> SaveFileAsync(
        IFormFile file, int documentId, string versionNumber)
    {
        var uploadsRoot = Path.Combine(_env.ContentRootPath, "Uploads", "Documents", documentId.ToString());
        Directory.CreateDirectory(uploadsRoot);

        var safeName = Path.GetFileName(file.FileName);
        var storedName = $"{versionNumber}_{DateTime.UtcNow:yyyyMMddHHmmss}_{safeName}";
        var fullPath = Path.Combine(uploadsRoot, storedName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = Path.Combine("Uploads", "Documents", documentId.ToString(), storedName)
            .Replace("\\", "/");

        return (safeName, relativePath, file.ContentType, file.Length);
    }


    public async Task<List<DocumentDto>> GetByStatusAsync(string status)
    {
        return await _db.Documents.AsNoTracking()
            .Where(x => x.Status == status)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => Map(x))
            .ToListAsync();
    }

    public async Task<List<DocumentDto>> GetPendingReviewForConsultantAsync(int consultantUserId)
    {
        await AutoRejectAllOverdueAsync();

        var contractIds = await _db.ContractConsultants
            .Where(x => x.UserId == consultantUserId)
            .Select(x => x.ContractId)
            .ToListAsync();

        return await _db.Documents.AsNoTracking()
            .Where(x => contractIds.Contains(x.ContractId) && x.Status == DocumentStatuses.PendingReview)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => Map(x))
            .ToListAsync();
    }

    public async Task<List<DocumentDto>> GetRequiresRevisionForEngineerAsync(int engineerUserId)
    {
        var contractIds = await _db.ContractEngineers
            .Where(x => x.UserId == engineerUserId)
            .Select(x => x.ContractId)
            .ToListAsync();

        return await _db.Documents.AsNoTracking()
            .Where(x =>
                contractIds.Contains(x.ContractId) &&
                x.Status == DocumentStatuses.RequiresRevision)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => Map(x))
            .ToListAsync();
    }

    public async Task<List<DocumentDto>> GetByEngineerAsync(int engineerUserId)
    {
        var contractIds = await _db.ContractEngineers
            .Where(x => x.UserId == engineerUserId)
            .Select(x => x.ContractId)
            .ToListAsync();

        return await _db.Documents.AsNoTracking()
            .Where(x => contractIds.Contains(x.ContractId))
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => Map(x))
            .ToListAsync();
    }

    public async Task<List<DocumentDto>> GetByConsultantAsync(int consultantUserId)
    {
        var contractIds = await _db.ContractConsultants
            .Where(x => x.UserId == consultantUserId)
            .Select(x => x.ContractId)
            .ToListAsync();

        return await _db.Documents.AsNoTracking()
            .Where(x => contractIds.Contains(x.ContractId))
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => Map(x))
            .ToListAsync();
    }


    /// <summary>
    /// If DueDate has passed and document is still open (Pending / RequiresRevision),
    /// auto-reject it (Status = Rejected → Code D).
    /// </summary>
    private async Task ApplyOverdueRejectionIfNeededAsync(Document doc)
    {
        var changed = false;

        // 1) Past due + still open → reject document
        if (IsPastDueOpen(doc))
        {
            doc.Status = DocumentStatuses.Rejected;
            doc.UpdatedAt = DateTime.UtcNow;
            changed = true;
        }

        // 2) If document is Rejected, force any open versions closed too
        //    (covers partial updates where only Document.Status was set)
        if (doc.Status == DocumentStatuses.Rejected)
        {
            var openVersions = await _db.DocumentVersions
                .Where(v => v.DocumentId == doc.DocumentId &&
                            (v.ReviewStatus == DocumentStatuses.PendingReview ||
                             v.ReviewStatus == DocumentStatuses.RequiresRevision))
                .ToListAsync();
            foreach (var v in openVersions)
            {
                v.ReviewStatus = DocumentStatuses.Rejected;
                changed = true;
            }
        }

        if (changed)
            await _db.SaveChangesAsync();
    }

    private async Task AutoRejectAllOverdueAsync()
    {
        var today = DateTime.UtcNow.Date;
        // DueDate day fully passed (compare against today's midnight UTC)
        var overdue = await _db.Documents
            .Where(d => d.DueDate != null
                        && d.DueDate < today
                        && (d.Status == DocumentStatuses.PendingReview
                            || d.Status == DocumentStatuses.RequiresRevision))
            .ToListAsync();

        if (overdue.Count == 0) return;

        var ids = overdue.Select(d => d.DocumentId).ToList();
        foreach (var d in overdue)
        {
            d.Status = DocumentStatuses.Rejected;
            d.UpdatedAt = DateTime.UtcNow;
        }

        var openVersions = await _db.DocumentVersions
            .Where(v => ids.Contains(v.DocumentId) &&
                        (v.ReviewStatus == DocumentStatuses.PendingReview ||
                         v.ReviewStatus == DocumentStatuses.RequiresRevision))
            .ToListAsync();
        foreach (var v in openVersions)
            v.ReviewStatus = DocumentStatuses.Rejected;

        await _db.SaveChangesAsync();
    }

    private static bool IsPastDueOpen(Document d)
    {
        if (!d.DueDate.HasValue) return false;
        if (d.Status is not (DocumentStatuses.PendingReview or DocumentStatuses.RequiresRevision))
            return false;
        return DateTime.UtcNow.Date > d.DueDate.Value.Date;
    }

    private static DocumentDto Map(Document d)
    {
        var code = StatusToCode(d.Status);
        var (overdue, days) = ComputeOverdue(d.DueDate, d.Status);
        return new DocumentDto
        {
            DocumentId = d.DocumentId,
            DocumentNumber = d.DocumentNumber,
            ContractId = d.ContractId,
            DocumentTypeId = d.DocumentTypeId,
            DocumentCategoryId = d.DocumentCategoryId,
            ContractorId = d.ContractorId,
            SerialNumber = d.SerialNumber,
            Status = d.Status,
            Title = d.Title,
            Description = d.Description,
            CreatedByUserId = d.CreatedByUserId,
            CurrentVersionNumber = d.CurrentVersionNumber,
            CreatedAt = d.CreatedAt,
            UpdatedAt = d.UpdatedAt,
            InspectionRef = d.InspectionRef,
            IssueDate = d.IssueDate,
            InspectionDate = d.InspectionDate,
            DueDate = d.DueDate,
            ReplyDate = d.ReplyDate,
            Zone = d.Zone,
            Building = d.Building,
            Axis = d.Axis,
            IssuedByUserId = d.IssuedByUserId,
            DocumentControllerUserId = d.DocumentControllerUserId,
            Remarks = d.Remarks,
            Overdue = overdue,
            DaysOverdue = days,
            Code = code
        };
    }

    private static string StatusToCode(string status) => status switch
    {
        DocumentStatuses.Approved => "A",
        DocumentStatuses.ApprovedWithComments => "B",
        DocumentStatuses.RequiresRevision => "C",
        DocumentStatuses.Rejected => "D",
        _ => "UR"
    };

    private static (bool Overdue, int Days) ComputeOverdue(DateTime? dueDate, string status)
    {
        if (!dueDate.HasValue) return (false, 0);
        // Open statuses that can be overdue
        var open = status is DocumentStatuses.PendingReview or DocumentStatuses.RequiresRevision;
        if (!open) return (false, 0);

        // Compare calendar dates only (ignore time / kind)
        var due = dueDate.Value.Date;
        var today = DateTime.UtcNow.Date;
        if (today <= due) return (false, 0);
        return (true, (today - due).Days);
    }
}
