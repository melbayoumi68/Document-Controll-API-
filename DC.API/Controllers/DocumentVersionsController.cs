using DC.BLL.Dtos.DocumentVersions;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Authorize]
[Route("api/DocumentVersion")]
public class DocumentVersionsController : ControllerBase
{
    private readonly IDocumentVersionService _service;

    public DocumentVersionsController(IDocumentVersionService service)
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

    [HttpGet("by-document/{documentId:int}")]
    public async Task<IActionResult> GetByDocument(int documentId)
        => Ok(await _service.GetByDocumentAsync(documentId));

    /// <summary>Download the file attached to a document version.</summary>
    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var info = await _service.GetDownloadInfoAsync(id);
        if (info == null)
            return NotFound();

        var (fullPath, contentType, downloadName) = info.Value;
        var bytes = await System.IO.File.ReadAllBytesAsync(fullPath);
        return File(bytes, contentType, downloadName);
    }

    [HttpPost]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Create([FromBody] CreateDocumentVersionDto dto)
        => Ok(await _service.CreateAsync(dto));

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDocumentVersionDto dto)
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
