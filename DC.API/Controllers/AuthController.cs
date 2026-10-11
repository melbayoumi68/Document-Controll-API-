using System.Security.Claims;
using DC.BLL.Dtos.Auth;
using DC.BLL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Route("api/Auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth)
    {
        _auth = auth;
    }

    /// <summary>Login with username or email + password. Returns JWT.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _auth.LoginAsync(dto);
        return Ok(result);
    }

    /// <summary>Change password for the currently authenticated user.</summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangeMyPassword([FromBody] ChangeMyPasswordDto dto)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            return Unauthorized(new { error = "Invalid token." });

        await _auth.ChangeMyPasswordAsync(userId, dto);
        return NoContent();
    }
}
