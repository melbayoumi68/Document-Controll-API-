namespace DC.DAL.Models;

/// <summary>Reference only — used in document coding (attribute 3). Not a system user.</summary>
public class Contractor
{
    public int ContractorId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Abbreviation { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
