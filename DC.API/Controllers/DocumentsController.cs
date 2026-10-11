using DC.BLL.Dtos.Documents;
using DC.BLL.Dtos.DocumentVersions;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using DC.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Route("api/Document")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _service;

    public DocumentsController(IDocumentService service)
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

    [HttpGet("by-contract/{contractId:int}")]
    public async Task<IActionResult> GetByContract(int contractId)
        => Ok(await _service.GetByContractAsync(contractId));

    [HttpGet("by-status/{status}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> GetByStatus(string status)
        => Ok(await _service.GetByStatusAsync(status));

    /// <summary>Pending review for the logged-in consultant (or SuperAdmin with optional query).</summary>
    [HttpGet("pending-for-me")]
    [Authorize(Roles = $"{Roles.Consultant},{Roles.SuperAdmin}")]
    public async Task<IActionResult> GetPendingForMe()
    {
        var userId = CurrentUser.GetUserId(User);
        return Ok(await _service.GetPendingReviewForConsultantAsync(userId));
    }

    /// <summary>Requires revision for the logged-in engineer.</summary>
    [HttpGet("requires-revision-for-me")]
    [Authorize(Roles = $"{Roles.ToEngineer},{Roles.SuperAdmin}")]
    public async Task<IActionResult> GetRequiresRevisionForMe()
    {
        var userId = CurrentUser.GetUserId(User);
        return Ok(await _service.GetRequiresRevisionForEngineerAsync(userId));
    }

    [HttpGet("my-documents")]
    [Authorize(Roles = $"{Roles.ToEngineer},{Roles.Consultant},{Roles.SuperAdmin}")]
    public async Task<IActionResult> GetMyDocuments()
    {
        var userId = CurrentUser.GetUserId(User);
        var role = CurrentUser.GetRole(User);

        if (role == Roles.Consultant)
            return Ok(await _service.GetByConsultantAsync(userId));

        // Engineer or SuperAdmin: engineer view
        return Ok(await _service.GetByEngineerAsync(userId));
    }

    [HttpPost]
    [Authorize(Roles = $"{Roles.ToEngineer},{Roles.SuperAdmin}")]
    public async Task<IActionResult> Create([FromBody] CreateDocumentDto dto)
    {
        // Force creator from token
        dto.CreatedByUserId = CurrentUser.GetUserId(User);
        return Ok(await _service.CreateAsync(dto));
    }

    [HttpPost("submit")]
    [Authorize(Roles = $"{Roles.ToEngineer},{Roles.SuperAdmin}")]
    [RequestSizeLimit(30_000_000)]
    public async Task<IActionResult> Submit([FromForm] SubmitDocumentDto dto, IFormFile file)
    {
        dto.CreatedByUserId = CurrentUser.GetUserId(User);
        return Ok(await _service.SubmitAsync(dto, file));
    }

    [HttpPost("upload-version")]
    [Authorize(Roles = $"{Roles.ToEngineer},{Roles.SuperAdmin}")]
    [RequestSizeLimit(30_000_000)]
    public async Task<IActionResult> UploadVersion([FromForm] UploadVersionDto dto, IFormFile file)
    {
        dto.UploadedByUserId = CurrentUser.GetUserId(User);
        return Ok(await _service.UploadNewVersionAsync(dto, file));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{Roles.ToEngineer},{Roles.SuperAdmin}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDocumentDto dto)
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
