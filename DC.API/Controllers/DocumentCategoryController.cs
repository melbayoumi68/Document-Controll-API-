using DC.BLL.Dtos.DocumentCategories;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Authorize]
[Route("api/DocumentCategory")]
public class DocumentCategoryController : ControllerBase
{
    private readonly IDocumentCategory _documentCategoryService;

    public DocumentCategoryController(IDocumentCategory documentCategoryService)
    {
        _documentCategoryService = documentCategoryService;
    }

    /// <summary>
    /// Get all categories, or only those linked to a document type when documentTypeId is provided.
    /// When filtered by type, only active linked categories are returned.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? documentTypeId = null)
    {
        if (documentTypeId.HasValue)
        {
            try
            {
                var filtered = await _documentCategoryService.GetByDocumentTypeIdAsync(documentTypeId.Value);
                return Ok(filtered);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Document type not found." });
            }
        }

        var result = await _documentCategoryService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _documentCategoryService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDocumentCategoryDto dto)
    {
        var result = await _documentCategoryService.CreateAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDocumentCategoryDto dto)
    {
        var result = await _documentCategoryService.UpdateAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _documentCategoryService.DeactivateAsync(id);
        return NoContent();
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{id}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        await _documentCategoryService.ActivateAsync(id);
        return NoContent();
    }
}
