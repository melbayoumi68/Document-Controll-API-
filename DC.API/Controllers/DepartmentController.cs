using DC.BLL.Dtos.Departments;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Authorize]
[Route("api/Department")]
public class DepartmentController : ControllerBase
{
    private readonly IDepartmentServices _departmentServices;

    public DepartmentController(IDepartmentServices departmentServices)
    {
        _departmentServices = departmentServices;
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DepartmentCreateDto dto)
    {
        var result = await _departmentServices.CreateAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{departmentId}")]
    public async Task<IActionResult> Update(int departmentId, [FromBody] DepartmentUpdateDto dto)
    {
        var result = await _departmentServices.UpdateAsync(departmentId, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
    {
        var result = await _departmentServices.GetAllAsync(activeOnly);
        return Ok(result);
    }

    [HttpGet("{departmentId}")]
    public async Task<IActionResult> GetById(int departmentId)
    {
        var result = await _departmentServices.GetByIdAsync(departmentId);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{departmentId}/deactivate")]
    public async Task<IActionResult> Deactivate(int departmentId)
    {
        await _departmentServices.DeactivateAsync(departmentId);
        return NoContent();
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{departmentId}/activate")]
    public async Task<IActionResult> Activate(int departmentId)
    {
        await _departmentServices.ActivateAsync(departmentId);
        return NoContent();
    }
}
