using DC.BLL.Dtos.Users;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using DC.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
        => Ok(await _userService.GetAllAsync(activeOnly));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        // User can read self; SuperAdmin can read anyone
        var currentId = CurrentUser.GetUserId(User);
        if (id != currentId && !CurrentUser.IsSuperAdmin(User))
            return Forbid();

        var result = await _userService.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var id = CurrentUser.GetUserId(User);
        var result = await _userService.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        => Ok(await _userService.CreateAsync(dto));

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var result = await _userService.UpdateAsync(id, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPut("activate/{id:int}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Activate(int id)
    {
        await _userService.ActivateAsync(id);
        return NoContent();
    }

    [HttpPut("deactivate/{id:int}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _userService.DeactivateAsync(id);
        return NoContent();
    }

    /// <summary>Admin reset password for any user. Prefer /api/Auth/change-password for self.</summary>
    [HttpPut("change-password/{id:int}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto dto)
    {
        await _userService.ChangePasswordAsync(id, dto);
        return NoContent();
    }

    [HttpDelete("{userId}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Delete(int userId)
    {
        var result = await _userService.DeleteAsync(userId);

        return StatusCode(result.StatusCode, new
        {
            message = result.Message
        });
    }
}
