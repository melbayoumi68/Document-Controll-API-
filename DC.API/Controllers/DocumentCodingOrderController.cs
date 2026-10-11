using DC.BLL.Dtos.Coding;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Route("api/coding-order")]
[Authorize]
public class DocumentCodingOrderController : ControllerBase
{
    private readonly IDocumentCodingOrderService _service;

    public DocumentCodingOrderController(IDocumentCodingOrderService service)
        => _service = service;

    /// <summary>
    /// جلب الترتيب الحالي (متاح لكل المستخدمين المسجّلين — للعرض في الواجهة).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Get()
        => Ok(await _service.GetOrderAsync());

    /// <summary>
    /// تحديث الترتيب — Super Admin فقط.
    /// Body: { "orderedParts": ["ProjectCode","CategoryCode", ...] }
    /// </summary>
    [HttpPut]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> Update([FromBody] UpdateCodingOrderDto dto)
    {
        try
        {
            var result = await _service.UpdateOrderAsync(dto);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
