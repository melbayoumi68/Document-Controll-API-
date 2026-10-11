namespace DC.BLL.Dtos.Documents;

public class DocumentDto
{
    public int DocumentId { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public int ContractId { get; set; }
    public int DocumentTypeId { get; set; }
    public int DocumentCategoryId { get; set; }
    public int? ContractorId { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int CreatedByUserId { get; set; }
    public string CurrentVersionNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Log fields
    public string? InspectionRef { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? InspectionDate { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? ReplyDate { get; set; }
    public string? Zone { get; set; }
    public string? Building { get; set; }
    public string? Axis { get; set; }
    public int? IssuedByUserId { get; set; }
    public int? DocumentControllerUserId { get; set; }
    public string? Remarks { get; set; }

    /// <summary>Computed: DueDate passed and status still open.</summary>
    public bool Overdue { get; set; }
    public int DaysOverdue { get; set; }

    /// <summary>Log code: UR | A | B | C | D derived from Status.</summary>
    public string Code { get; set; } = "UR";
}
