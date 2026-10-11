using DC.BLL.Dtos.Contractors;

namespace DC.BLL.Interfaces;

public interface IContractorService
{
    Task<ContractorDto> CreateAsync(CreateContractorDto dto);
    Task<ContractorDto?> UpdateAsync(int contractorId, UpdateContractorDto dto);
    Task<List<ContractorDto>> GetAllAsync(bool activeOnly = false);
    Task<ContractorDto?> GetByIdAsync(int contractorId);
    Task ActivateAsync(int contractorId);
    Task DeactivateAsync(int contractorId);
}
