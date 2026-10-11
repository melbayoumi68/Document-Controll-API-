using DC.BLL.Dtos.Projects;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using DC.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Authorize]
[Route("api/Project")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProjectCreateDto dto)
    {
        var userId = CurrentUser.GetUserId(User);
        var result = await _projectService.CreateAsync(dto, userId);
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{projectId}")]
    public async Task<IActionResult> Update(int projectId, [FromBody] ProjectUpdateDto dto)
    {
        var result = await _projectService.UpdateAsync(projectId, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{projectId}")]
    public async Task<IActionResult> GetById(int projectId)
    {
        var result = await _projectService.GetByIdAsync(projectId);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
    {
        var result = await _projectService.GetAllAsync(activeOnly);
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{projectId}/deactivate")]
    public async Task<IActionResult> Deactivate(int projectId)
    {
        await _projectService.DeactivateAsync(projectId);
        return NoContent();
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{projectId}/activate")]
    public async Task<IActionResult> Activate(int projectId)
    {
        await _projectService.ActivateAsync(projectId);
        return NoContent();
    }

    /// <summary>
    /// Permanently delete project and everything under it
    /// (contracts, documents, versions, reviews, assignments, related notifications).
    /// </summary>
    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpDelete("{projectId}")]
    public async Task<IActionResult> Delete(int projectId)
    {
        await _projectService.DeleteAsync(projectId);
        return NoContent();
    }
}
