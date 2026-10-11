namespace DC.BLL.Dtos.DocumentVersions;

public class DocumentVersionDto
{
    public int VersionId { get; set; }
    public int DocumentId { get; set; }
    public string VersionNumber { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public string? FilePath { get; set; }
    public string? FileContentType { get; set; }
    public long? FileSizeBytes { get; set; }
    public int UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; }
    public string ReviewStatus { get; set; } = string.Empty;
    public string? Notes { get; set; }
}
