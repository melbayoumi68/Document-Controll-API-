using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.DocumentVersions;

/// <summary>
/// Upload a new version for an existing document (after RequiresRevision).
/// </summary>
public class UploadVersionDto
{
    [Required]
    public int DocumentId { get; set; }

    [Required]
    public int UploadedByUserId { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}
