namespace DC.BLL.Dtos.Contractors;

public class ContractorDto
{
    public int ContractorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Abbreviation { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
