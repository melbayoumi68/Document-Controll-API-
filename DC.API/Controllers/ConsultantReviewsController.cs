using DC.BLL.Dtos.ConsultantReviews;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using DC.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Route("api/ConsultantReview")]
[Authorize]

public class ConsultantReviewsController : ControllerBase
{
    private readonly IConsultantReviewService _service;

    public ConsultantReviewsController(IConsultantReviewService service)
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
        return r == null ? NotFound() : Ok(r);
    }

    [HttpGet("by-version/{versionId:int}")]
    public async Task<IActionResult> GetByVersion(int versionId)
        => Ok(await _service.GetByVersionAsync(versionId));

    [HttpPost]
    [Authorize(Roles = $"{Roles.Consultant},{Roles.ToEngineer},{Roles.SuperAdmin}")]
    public async Task<IActionResult> Create([FromBody] CreateConsultantReviewDto dto)
    {
        dto.ConsultantUserId = CurrentUser.GetUserId(User);
        return Ok(await _service.CreateAsync(dto));
    }

    [HttpPost("submit")]
    [Authorize(Roles = $"{Roles.Consultant},{Roles.ToEngineer},{Roles.SuperAdmin}")]
    public async Task<IActionResult> Submit([FromBody] SubmitReviewDto dto)
    {
        // Ignore client-sent consultantUserId — use token
        dto.ConsultantUserId = CurrentUser.GetUserId(User);
        return Ok(await _service.SubmitReviewAsync(dto));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateConsultantReviewDto dto)
    {
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
