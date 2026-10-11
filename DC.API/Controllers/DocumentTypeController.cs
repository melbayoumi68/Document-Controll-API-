using DC.BLL.Dtos.DocumentTypes;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Authorize]
[Route("api/DocumentType")]
public class DocumentTypeController : ControllerBase
{
    private readonly IDocumentType _documentTypeService;

    public DocumentTypeController(IDocumentType documentTypeService)
    {
        _documentTypeService = documentTypeService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _documentTypeService.GetAllDocumentTypesAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _documentTypeService.GetDocumentTypeByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    /// <summary>Active categories linked to this document type.</summary>
    [HttpGet("{id}/categories")]
    public async Task<IActionResult> GetCategories(int id)
    {
        try
        {
            var result = await _documentTypeService.GetCategoriesByTypeIdAsync(id, activeOnly: true);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDocumentTypeDto dto)
    {
        try
        {
            var result = await _documentTypeService.CreateDocumentTypeAsync(dto);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] DocumentTypeUpdateDto dto)
    {
        try
        {
            var result = await _documentTypeService.UpdateDocumentTypeAsync(id, dto);
            if (result == null) return NotFound();
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Replace the full set of categories linked to this type.</summary>
    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{id}/categories")]
    public async Task<IActionResult> AssignCategories(int id, [FromBody] AssignCategoriesToTypeDto dto)
    {
        try
        {
            await _documentTypeService.AssignCategoriesAsync(id, dto.CategoryIds ?? new List<int>());
            var result = await _documentTypeService.GetDocumentTypeByIdAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _documentTypeService.DeactivateAsync(id);
        return NoContent();
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{id}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        await _documentTypeService.ActivateAsync(id);
        return NoContent();
    }
}
