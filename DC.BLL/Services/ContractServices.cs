using DC.DAL.Data;
using DC.BLL.Dtos.Contracts;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class ContractService : IContractService
{
    private readonly AppDbContext _db;

    public ContractService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ContractResponseDto> CreateAsync(ContractCreateDto dto)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == dto.ProjectId);
        if (project == null)
            throw new KeyNotFoundException("Project not found.");

        var codeExists = await _db.Contracts.AnyAsync(c => c.ContractCode == dto.ContractCode);
        if (codeExists)
            throw new InvalidOperationException("Contract code already exists.");

        var contract = new Contract
        {
            ProjectId = dto.ProjectId,
            ContractName = dto.ContractName,
            ContractCode = dto.ContractCode,
            StartDate = dto.StartDate,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Contracts.Add(contract);
        await _db.SaveChangesAsync();

        return await MapAsync(contract, project.ProjectName);
    }

    public async Task<ContractResponseDto?> UpdateAsync(int contractId, ContractUpdateDto dto)
    {
        var contract = await _db.Contracts
            .Include(c => c.Project)
            .FirstOrDefaultAsync(c => c.ContractId == contractId);
        if (contract == null) return null;

        contract.ContractName = dto.ContractName;
        contract.StartDate = dto.StartDate;
        contract.IsActive = dto.IsActive;
        contract.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return await MapAsync(contract, contract.Project.ProjectName);
    }

    public async Task<ContractResponseDto?> GetByIdAsync(int contractId)
    {
        var contract = await _db.Contracts.AsNoTracking()
            .Include(c => c.Project)
            .FirstOrDefaultAsync(c => c.ContractId == contractId);
        if (contract == null) return null;

        return await MapAsync(contract, contract.Project.ProjectName);
    }

    public async Task<List<ContractResponseDto>> GetAllAsync()
    {
        var contracts = await _db.Contracts.AsNoTracking()
            .Include(c => c.Project)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var result = new List<ContractResponseDto>();
        foreach (var c in contracts)
            result.Add(await MapAsync(c, c.Project.ProjectName));
        return result;
    }

    public async Task<List<ContractResponseDto>> GetByProjectAsync(int projectId)
    {
        var contracts = await _db.Contracts.AsNoTracking()
            .Include(c => c.Project)
            .Where(c => c.ProjectId == projectId)
            .ToListAsync();

        var result = new List<ContractResponseDto>();
        foreach (var c in contracts)
            result.Add(await MapAsync(c, c.Project.ProjectName));
        return result;
    }

    public async Task<List<ContractResponseDto>> GetMyContractsAsync(int userId, string role)
    {
        List<int> contractIds;

        if (role == Roles.ToEngineer)
        {
            contractIds = await _db.ContractEngineers
                .Where(x => x.UserId == userId)
                .Select(x => x.ContractId)
                .ToListAsync();
        }
        else if (role == Roles.Consultant)
        {
            contractIds = await _db.ContractConsultants
                .Where(x => x.UserId == userId)
                .Select(x => x.ContractId)
                .ToListAsync();
        }
        else
        {
            return new List<ContractResponseDto>();
        }

        var contracts = await _db.Contracts.AsNoTracking()
            .Include(c => c.Project)
            .Where(c => contractIds.Contains(c.ContractId))
            .ToListAsync();

        var result = new List<ContractResponseDto>();
        foreach (var c in contracts)
            result.Add(await MapAsync(c, c.Project.ProjectName));
        return result;
    }

    public async Task DeactivateAsync(int contractId)
    {
        var contract = await _db.Contracts.FirstOrDefaultAsync(c => c.ContractId == contractId);
        if (contract == null) throw new KeyNotFoundException("Contract not found.");

        contract.IsActive = false;
        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task ActivateAsync(int contractId)
    {
        var contract = await _db.Contracts.FirstOrDefaultAsync(c => c.ContractId == contractId);
        if (contract == null) throw new KeyNotFoundException("Contract not found.");

        contract.IsActive = true;
        contract.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private async Task<ContractResponseDto> MapAsync(Contract c, string projectName)
    {
        var engCount = await _db.ContractEngineers.CountAsync(x => x.ContractId == c.ContractId);
        var conCount = await _db.ContractConsultants.CountAsync(x => x.ContractId == c.ContractId);
        var docCount = await _db.Documents.CountAsync(x => x.ContractId == c.ContractId);

        return new ContractResponseDto
        {
            ContractId = c.ContractId,
            ProjectId = c.ProjectId,
            ProjectName = projectName,
            ContractName = c.ContractName,
            ContractCode = c.ContractCode,
            StartDate = c.StartDate,
            IsActive = c.IsActive,
            EngineersCount = engCount,
            ConsultantsCount = conCount,
            DocumentsCount = docCount,
            CreatedAt = c.CreatedAt,
            UpdatedAt = c.UpdatedAt
        };
    }
}
