using DC.DAL.Data;
using DC.BLL.Dtos.Contractors;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class ContractorServices : IContractorService
{
    private readonly AppDbContext _db;
    public ContractorServices(AppDbContext db) { _db = db; }

    public async Task<ContractorDto> CreateAsync(CreateContractorDto dto)
    {
        if (await _db.Contractors.AnyAsync(c => c.Abbreviation == dto.Abbreviation))
            throw new InvalidOperationException("Contractor abbreviation already exists.");
        var c = new Contractor { Name = dto.Name, Abbreviation = dto.Abbreviation, IsActive = true, CreatedAt = DateTime.UtcNow };
        _db.Contractors.Add(c);
        await _db.SaveChangesAsync();
        return Map(c);
    }

    public async Task<ContractorDto?> UpdateAsync(int id, UpdateContractorDto dto)
    {
        var c = await _db.Contractors.FirstOrDefaultAsync(x => x.ContractorId == id);
        if (c == null) return null;
        if (await _db.Contractors.AnyAsync(x => x.ContractorId != id && x.Abbreviation == dto.Abbreviation))
            throw new InvalidOperationException("Contractor abbreviation already exists.");
        c.Name = dto.Name; c.Abbreviation = dto.Abbreviation; c.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Map(c);
    }

    public async Task<List<ContractorDto>> GetAllAsync(bool activeOnly = false)
    {
        var q = _db.Contractors.AsNoTracking().AsQueryable();
        if (activeOnly) q = q.Where(x => x.IsActive);
        return await q.OrderBy(x => x.ContractorId).Select(x => Map(x)).ToListAsync();
    }

    public async Task<ContractorDto?> GetByIdAsync(int id)
    {
        var c = await _db.Contractors.AsNoTracking().FirstOrDefaultAsync(x => x.ContractorId == id);
        return c == null ? null : Map(c);
    }

    public async Task ActivateAsync(int id)
    {
        var c = await _db.Contractors.FirstOrDefaultAsync(x => x.ContractorId == id)
            ?? throw new KeyNotFoundException("Contractor not found.");
        c.IsActive = true; await _db.SaveChangesAsync();
    }

    public async Task DeactivateAsync(int id)
    {
        var c = await _db.Contractors.FirstOrDefaultAsync(x => x.ContractorId == id)
            ?? throw new KeyNotFoundException("Contractor not found.");
        c.IsActive = false; await _db.SaveChangesAsync();
    }

    private static ContractorDto Map(Contractor c) => new()
    {
        ContractorId = c.ContractorId, Name = c.Name, Abbreviation = c.Abbreviation,
        IsActive = c.IsActive, CreatedAt = c.CreatedAt
    };
}
