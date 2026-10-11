using DC.BLL.Dtos.AuditLogs;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Route("api/AuditLog")]
[Authorize(Roles = Roles.SuperAdmin)]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _service;

    public AuditLogsController(IAuditLogService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var r = await _service.GetByIdAsync(id);
        return r == null ? NotFound() : Ok(r);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAuditLogDto dto)
        => Ok(await _service.CreateAsync(dto));

    // Append-only preference: delete restricted to SuperAdmin already via class attribute
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
