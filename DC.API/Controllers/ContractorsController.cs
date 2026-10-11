using DC.BLL.Dtos.Contractors;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Authorize]
[Route("api/Contractor")]
public class ContractorsController : ControllerBase
{
    private readonly IContractorService _contractorService;

    public ContractorsController(IContractorService contractorService)
    {
        _contractorService = contractorService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = false)
    {
        var result = await _contractorService.GetAllAsync(activeOnly);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _contractorService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContractorDto dto)
    {
        var result = await _contractorService.CreateAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateContractorDto dto)
    {
        var result = await _contractorService.UpdateAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{id}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        await _contractorService.ActivateAsync(id);
        return NoContent();
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _contractorService.DeactivateAsync(id);
        return NoContent();
    }
}
