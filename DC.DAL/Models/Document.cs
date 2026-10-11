using DC.DAL.Models;

namespace DC.DAL.Models;

public class Document
{
    public int DocumentId { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public int ContractId { get; set; }
    public int DocumentTypeId { get; set; }
    public int DocumentCategoryId { get; set; }
    public int? ContractorId { get; set; }
    public string SerialNumber { get; set; } = string.Empty;
    public string Status { get; set; } = DocumentStatuses.PendingReview;
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int CreatedByUserId { get; set; }
    public string CurrentVersionNumber { get; set; } = "01";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // --- Log / sheet fields (all document types) ---
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

    public Contract Contract { get; set; } = null!;
    public DocumentType DocumentType { get; set; } = null!;
    public DocumentCategory DocumentCategory { get; set; } = null!;
    public Contractor? Contractor { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public User? IssuedByUser { get; set; }
    public User? DocumentControllerUser { get; set; }
    public ICollection<DocumentVersion> Versions { get; set; } = new List<DocumentVersion>();
}
