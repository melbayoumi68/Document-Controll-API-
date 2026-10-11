namespace DC.DAL.Models;

public class Contract
{
    public int ContractId { get; set; }
    public int ProjectId { get; set; }
    public string ContractName { get; set; } = string.Empty;
    public string ContractCode { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Project Project { get; set; } = null!;
    public ICollection<ContractEngineer> Engineers { get; set; } = new List<ContractEngineer>();
    public ICollection<ContractConsultant> Consultants { get; set; } = new List<ContractConsultant>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
