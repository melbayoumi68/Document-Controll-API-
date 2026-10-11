namespace DC.BLL.Dtos.Departments;

public class DepartmentDto
{
    public int DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public bool IsActive { get; set; }
    public int EngineersCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
