using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Documents;

public class UpdateDocumentDto
{
    [MaxLength(300)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public int? ContractorId { get; set; }

    [MaxLength(40)]
    public string? Status { get; set; }

    [MaxLength(10)]
    public string? CurrentVersionNumber { get; set; }

    [MaxLength(100)]
    public string? InspectionRef { get; set; }

    public DateTime? IssueDate { get; set; }
    public DateTime? InspectionDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ReplyDate { get; set; }

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
