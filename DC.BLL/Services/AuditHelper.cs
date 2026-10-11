using DC.DAL.Data;
using DC.DAL.Models;

namespace DC.BLL.Services;

/// <summary>
/// Simple automatic audit log writer. No complex pipeline.
/// </summary>
public class AuditHelper
{
    private readonly AppDbContext _db;

    public AuditHelper(AppDbContext db)
    {
        _db = db;
    }

    public async Task LogAsync(
        int? userId,
        string action,
        string entityType,
        int? entityId,
        string? details = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details,
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }
}
