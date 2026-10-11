using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Users;

public class ChangePasswordDto
{
    [Required, MinLength(6), MaxLength(100)]
    public string NewPassword { get; set; } = null!;
}
