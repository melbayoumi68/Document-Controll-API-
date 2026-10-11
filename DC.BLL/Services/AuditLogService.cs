using DC.DAL.Data;
using DC.BLL.Dtos.AuditLogs;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _db;
    public AuditLogService(AppDbContext db) { _db = db; }

    public async Task<List<AuditLogDtos>> GetAllAsync() =>
        await _db.AuditLogs.AsNoTracking().OrderByDescending(x => x.Timestamp).Select(x => Map(x)).ToListAsync();

    public async Task<AuditLogDtos?> GetByIdAsync(int id)
    {
        var e = await _db.AuditLogs.AsNoTracking().FirstOrDefaultAsync(x => x.AuditLogId == id);
        return e == null ? null : Map(e);
    }

    public async Task<AuditLogDtos> CreateAsync(CreateAuditLogDto dto)
    {
        if (dto.UserId.HasValue && !await _db.Users.AnyAsync(x => x.UserId == dto.UserId.Value))
            throw new KeyNotFoundException("User not found.");

        var e = new AuditLog
        {
            UserId = dto.UserId, Action = dto.Action, EntityType = dto.EntityType,
            EntityId = dto.EntityId, Details = dto.Details, Timestamp = DateTime.UtcNow
        };
        _db.AuditLogs.Add(e);
        await _db.SaveChangesAsync();
        return Map(e);
    }

    public async Task DeleteAsync(int id)
    {
        var e = await _db.AuditLogs.FirstOrDefaultAsync(x => x.AuditLogId == id)
            ?? throw new KeyNotFoundException("Audit log not found.");
        _db.AuditLogs.Remove(e);
        await _db.SaveChangesAsync();
    }

    private static AuditLogDtos Map(AuditLog a) => new()
    {
        AuditLogId = a.AuditLogId, UserId = a.UserId, Action = a.Action, EntityType = a.EntityType,
        EntityId = a.EntityId, Details = a.Details, Timestamp = a.Timestamp
    };
}
