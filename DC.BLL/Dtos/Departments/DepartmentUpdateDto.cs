using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Departments;

public class DepartmentUpdateDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Code { get; set; }

    public bool IsActive { get; set; } = true;
}
