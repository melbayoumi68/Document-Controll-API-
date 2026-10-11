using DC.DAL.Data;
using DC.BLL.Dtos.Departments;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class DepartmentService : IDepartmentServices
{
    private readonly AppDbContext _db;
    public DepartmentService(AppDbContext db) { _db = db; }

    public async Task<DepartmentDto> CreateAsync(DepartmentCreateDto dto)
    {
        if (await _db.Departments.AnyAsync(d => d.Name == dto.Name))
            throw new InvalidOperationException("Department name already exists.");
        var d = new Department { Name = dto.Name, Code = dto.Code, IsActive = true, CreatedAt = DateTime.UtcNow };
        _db.Departments.Add(d);
        await _db.SaveChangesAsync();
        return Map(d, 0);
    }

    public async Task<DepartmentDto?> UpdateAsync(int id, DepartmentUpdateDto dto)
    {
        var d = await _db.Departments.FirstOrDefaultAsync(x => x.DepartmentId == id);
        if (d == null) return null;
        if (await _db.Departments.AnyAsync(x => x.DepartmentId != id && x.Name == dto.Name))
            throw new InvalidOperationException("Department name already exists.");
        d.Name = dto.Name; d.Code = dto.Code; d.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        var count = await _db.Users.CountAsync(u => u.DepartmentId == id);
        return Map(d, count);
    }

    public async Task<DepartmentDto?> GetByIdAsync(int id)
    {
        var d = await _db.Departments.AsNoTracking().FirstOrDefaultAsync(x => x.DepartmentId == id);
        if (d == null) return null;
        var count = await _db.Users.CountAsync(u => u.DepartmentId == id);
        return Map(d, count);
    }

    public async Task<List<DepartmentDto>> GetAllAsync(bool activeOnly = false)
    {
        var q = _db.Departments.AsNoTracking().AsQueryable();
        if (activeOnly) q = q.Where(x => x.IsActive);
        var list = await q.OrderBy(x => x.DepartmentId).ToListAsync();
        var result = new List<DepartmentDto>();
        foreach (var d in list)
        {
            var count = await _db.Users.CountAsync(u => u.DepartmentId == d.DepartmentId);
            result.Add(Map(d, count));
        }
        return result;
    }

    public async Task DeactivateAsync(int id)
    {
        var d = await _db.Departments.FirstOrDefaultAsync(x => x.DepartmentId == id)
            ?? throw new KeyNotFoundException("Department not found.");
        d.IsActive = false; await _db.SaveChangesAsync();
    }

    public async Task ActivateAsync(int id)
    {
        var d = await _db.Departments.FirstOrDefaultAsync(x => x.DepartmentId == id)
            ?? throw new KeyNotFoundException("Department not found.");
        d.IsActive = true; await _db.SaveChangesAsync();
    }

    private static DepartmentDto Map(Department d, int count) => new()
    {
        DepartmentId = d.DepartmentId, Name = d.Name, Code = d.Code,
        IsActive = d.IsActive, EngineersCount = count, CreatedAt = d.CreatedAt
    };
}
