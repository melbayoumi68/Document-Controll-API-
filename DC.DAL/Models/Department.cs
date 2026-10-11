namespace DC.DAL.Models;

public class Department
{
    public int DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<User> Engineers { get; set; } = new List<User>();
}
