using DC.BLL.Dtos.Contracts;

namespace DC.BLL.Interfaces;

public interface IContractService
{
    Task<ContractResponseDto> CreateAsync(ContractCreateDto dto);
    Task<ContractResponseDto?> UpdateAsync(int contractId, ContractUpdateDto dto);
    Task<ContractResponseDto?> GetByIdAsync(int contractId);
    Task<List<ContractResponseDto>> GetAllAsync();
    Task<List<ContractResponseDto>> GetByProjectAsync(int projectId);
    Task<List<ContractResponseDto>> GetMyContractsAsync(int userId, string role);
    Task DeactivateAsync(int contractId);
    Task ActivateAsync(int contractId);
}
