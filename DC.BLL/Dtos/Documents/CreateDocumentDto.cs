using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Documents;

public class CreateDocumentDto
{
    [Required, MaxLength(100)]
    public string DocumentNumber { get; set; } = string.Empty;

    [Required]
    public int ContractId { get; set; }

    [Required]
    public int DocumentTypeId { get; set; }

    [Required]
    public int DocumentCategoryId { get; set; }

    public int? ContractorId { get; set; }

    [MaxLength(50)]
    public string SerialNumber { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public int CreatedByUserId { get; set; }
}
