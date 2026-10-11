using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.DocumentVersions;

public class CreateDocumentVersionDto
{
    [Required]
    public int DocumentId { get; set; }

    [Required, MaxLength(10)]
    public string VersionNumber { get; set; } = "01";

    [MaxLength(260)]
    public string? FileName { get; set; }

    [MaxLength(500)]
    public string? FilePath { get; set; }

    [MaxLength(150)]
    public string? FileContentType { get; set; }

    public long? FileSizeBytes { get; set; }

    [Required]
    public int UploadedByUserId { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}
