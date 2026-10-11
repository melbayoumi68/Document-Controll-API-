using DC.BLL.Dtos.ContractAssignment;

namespace DC.BLL.Interfaces;

public interface IContractAssignment
{
    Task<ContractAssignmentDto?> GetByContractIdAsync(int contractId);
    Task<ContractEngineerAssignmentDto> AssignEngineerAsync(AssignContractEngineerDto dto);
    Task<ContractConsultantAssignmentDto> AssignConsultantAsync(AssignContractConsultantDto dto);
    Task RemoveEngineerAsync(int contractEngineerId);
    Task RemoveConsultantAsync(int contractConsultantId);

    /// <summary>Marks InvitationSent = true and InvitationSentAt = now for a consultant assignment.</summary>
    Task<ContractConsultantAssignmentDto> MarkInvitationSentAsync(int contractConsultantId);
}
