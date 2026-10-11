using DC.BLL.Dtos.Notifications;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using DC.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Route("api/Notification")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    public NotificationsController(INotificationService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _service.GetByIdAsync(id);
        if (r == null) return NotFound();

        if (r.UserId != CurrentUser.GetUserId(User) && !CurrentUser.IsSuperAdmin(User))
            return Forbid();

        return Ok(r);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMy()
    {
        var userId = CurrentUser.GetUserId(User);
        return Ok(await _service.GetByUserAsync(userId));
    }

    [HttpPost]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Create([FromBody] CreateNotificationDto dto)
        => Ok(await _service.CreateAsync(dto));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateNotificationDto dto)
    {
        var existing = await _service.GetByIdAsync(id);
        if (existing == null) return NotFound();

        if (existing.UserId != CurrentUser.GetUserId(User) && !CurrentUser.IsSuperAdmin(User))
            return Forbid();

        var r = await _service.UpdateAsync(id, dto);
        return r == null ? NotFound() : Ok(r);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
