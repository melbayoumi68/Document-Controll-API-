using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Documents;

/// <summary>
/// Used when engineer submits a new document with a file.
/// DocumentNumber and SerialNumber are generated automatically.
/// </summary>
public class SubmitDocumentDto
{
    [Required]
    public int ContractId { get; set; }

    [Required]
    public int DocumentTypeId { get; set; }

    [Required]
    public int DocumentCategoryId { get; set; }

    public int? ContractorId { get; set; }

    [MaxLength(300)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public int CreatedByUserId { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    // --- Log fields (all document types) ---
    [MaxLength(100)]
    public string? InspectionRef { get; set; }

    public DateTime? IssueDate { get; set; }
    public DateTime? InspectionDate { get; set; }
    public DateTime? DueDate { get; set; }

    [MaxLength(100)]
    public string? Zone { get; set; }

    [MaxLength(100)]
    public string? Building { get; set; }

    [MaxLength(100)]
    public string? Axis { get; set; }

    public int? IssuedByUserId { get; set; }
    public int? DocumentControllerUserId { get; set; }

    [MaxLength(2000)]
    public string? Remarks { get; set; }
}
