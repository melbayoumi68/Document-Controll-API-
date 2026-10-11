namespace DC.BLL.Dtos.Projects;

public class ProjectResponseDto
{
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectCode { get; set; } = string.Empty;
    public string? Region { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int? CreatedByUserId { get; set; }
    public int ContractsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
