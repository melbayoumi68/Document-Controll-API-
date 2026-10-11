using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Contracts;

public class ContractCreateDto
{
    [Required]
    public int ProjectId { get; set; }

    [Required, MaxLength(200)]
    public string ContractName { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string ContractCode { get; set; } = string.Empty;

    public DateTime? StartDate { get; set; }
}
