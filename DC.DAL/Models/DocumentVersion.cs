namespace DC.DAL.Models;


public class DocumentVersion
{
    public int VersionId { get; set; }
    public int DocumentId { get; set; }
    public string VersionNumber { get; set; } = "01";
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public string? FileContentType { get; set; }
    public long? FileSizeBytes { get; set; }
    public int UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string ReviewStatus { get; set; } = DocumentStatuses.PendingReview;
    public string? Notes { get; set; }

    public Document Document { get; set; } = null!;
    public User UploadedByUser { get; set; } = null!;
    public ICollection<ConsultantReview> Reviews { get; set; } = new List<ConsultantReview>();
}
