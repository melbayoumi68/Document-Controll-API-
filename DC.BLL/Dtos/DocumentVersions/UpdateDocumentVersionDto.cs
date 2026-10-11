using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.DocumentVersions;

public class UpdateDocumentVersionDto
{
    [MaxLength(260)]
    public string? FileName { get; set; }

    [MaxLength(500)]
    public string? FilePath { get; set; }

    [MaxLength(150)]
    public string? FileContentType { get; set; }

    public long? FileSizeBytes { get; set; }

    [MaxLength(40)]
    public string? ReviewStatus { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}
