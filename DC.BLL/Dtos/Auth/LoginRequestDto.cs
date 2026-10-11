using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Auth;

public class LoginRequestDto
{
    /// <summary>Username or Email</summary>
    [Required, MaxLength(150)]
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required, MinLength(6), MaxLength(100)]
    public string Password { get; set; } = string.Empty;
}
