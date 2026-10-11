using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Contractors;

public class UpdateContractorDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Abbreviation { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
