using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Users;

public class CreateUserDto
{
    [Required, MinLength(3), MaxLength(50)]
    public string Username { get; set; } = null!;

    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = null!;

    [Required, MinLength(6), MaxLength(100)]
    public string Password { get; set; } = null!;

    [Required, MinLength(2), MaxLength(150)]
    public string FullName { get; set; } = null!;

    [Required]
    public string Role { get; set; } = null!;

    public int? DepartmentId { get; set; }
}
