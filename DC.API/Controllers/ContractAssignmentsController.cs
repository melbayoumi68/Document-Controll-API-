using DC.BLL.Dtos.ContractAssignment;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DC.API.Controllers;

[ApiController]
[Route("api/ContractAssignment")]
[Authorize]
public class ContractAssignmentsController : ControllerBase
{
    private readonly IContractAssignment _contractAssignments;

    public ContractAssignmentsController(IContractAssignment contractAssignments)
    {
        _contractAssignments = contractAssignments;
    }

    [HttpGet("contract/{contractId:int}")]
    public async Task<IActionResult> GetByContractId(int contractId)
    {
        var result = await _contractAssignments.GetByContractIdAsync(contractId);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("engineer")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> AssignEngineer([FromBody] AssignContractEngineerDto dto)
        => Ok(await _contractAssignments.AssignEngineerAsync(dto));

    [HttpPost("consultant")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> AssignConsultant([FromBody] AssignContractConsultantDto dto)
        => Ok(await _contractAssignments.AssignConsultantAsync(dto));

    [HttpDelete("engineer/{assignmentId:int}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> RemoveEngineer(int assignmentId)
    {
        await _contractAssignments.RemoveEngineerAsync(assignmentId);
        return NoContent();
    }

    [HttpDelete("consultant/{assignmentId:int}")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> RemoveConsultant(int assignmentId)
    {
        await _contractAssignments.RemoveConsultantAsync(assignmentId);
        return NoContent();
    }

    [HttpPut("consultant/{assignmentId:int}/mark-invitation-sent")]
    [Authorize(Roles = Roles.SuperAdmin)]
    public async Task<IActionResult> MarkInvitationSent(int assignmentId)
        => Ok(await _contractAssignments.MarkInvitationSentAsync(assignmentId));
}
