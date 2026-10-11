using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Projects;

public class ProjectCreateDto
{
    [Required, MaxLength(200)]
    public string ProjectName { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string ProjectCode { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Region { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }
}
