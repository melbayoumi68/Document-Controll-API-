namespace DC.DAL.Models;

public class Project
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectCode { get; set; } = string.Empty;
    public string? Region { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User? CreatedByUser { get; set; }
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
}
