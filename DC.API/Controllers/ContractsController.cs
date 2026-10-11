using DC.BLL.Dtos.Contracts;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using DC.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Authorize]
[Route("api/Contract")]
public class ContractsController : ControllerBase
{
    private readonly IContractService _contractService;

    public ContractsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _contractService.GetAllAsync();
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ContractCreateDto dto)
    {
        var result = await _contractService.CreateAsync(dto);
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{contractId}")]
    public async Task<IActionResult> Update(int contractId, [FromBody] ContractUpdateDto dto)
    {
        var result = await _contractService.UpdateAsync(contractId, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{contractId}")]
    public async Task<IActionResult> GetById(int contractId)
    {
        var result = await _contractService.GetByIdAsync(contractId);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("by-project/{projectId}")]
    public async Task<IActionResult> GetByProject(int projectId)
    {
        var result = await _contractService.GetByProjectAsync(projectId);
        return Ok(result);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var userId = CurrentUser.GetUserId(User);
        var role = CurrentUser.GetRole(User);
        var result = await _contractService.GetMyContractsAsync(userId, role);
        return Ok(result);
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{contractId}/deactivate")]
    public async Task<IActionResult> Deactivate(int contractId)
    {
        await _contractService.DeactivateAsync(contractId);
        return NoContent();
    }

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPut("{contractId}/activate")]
    public async Task<IActionResult> Activate(int contractId)
    {
        await _contractService.ActivateAsync(contractId);
        return NoContent();
    }
}
