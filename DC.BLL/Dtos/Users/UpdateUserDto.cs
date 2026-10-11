using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Users;

public class UpdateUserDto
{
    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = null!;

    [Required, MinLength(2), MaxLength(150)]
    public string FullName { get; set; } = null!;

    [Required]
    public string Role { get; set; } = null!;

    public int? DepartmentId { get; set; }

    public bool IsActive { get; set; }
}
