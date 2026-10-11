using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Auth;

public class ChangeMyPasswordDto
{
    [Required, MinLength(6), MaxLength(100)]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required, MinLength(6), MaxLength(100)]
    public string NewPassword { get; set; } = string.Empty;
}
