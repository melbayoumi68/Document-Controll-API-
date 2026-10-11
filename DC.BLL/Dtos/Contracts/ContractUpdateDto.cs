using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Contracts;

public class ContractUpdateDto
{
    [Required, MaxLength(200)]
    public string ContractName { get; set; } = string.Empty;

    public DateTime? StartDate { get; set; }

    public bool IsActive { get; set; } = true;
}
