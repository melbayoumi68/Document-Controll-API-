using DC.DAL.Data;
using DC.BLL.Dtos.Notifications;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    public NotificationService(AppDbContext db) { _db = db; }

    public async Task<List<NotificationDto>> GetAllAsync() =>
        await _db.Notifications.AsNoTracking().OrderByDescending(x => x.CreatedAt).Select(x => Map(x)).ToListAsync();

    public async Task<NotificationDto?> GetByIdAsync(int id)
    {
        var e = await _db.Notifications.AsNoTracking().FirstOrDefaultAsync(x => x.NotificationId == id);
        return e == null ? null : Map(e);
    }

    public async Task<List<NotificationDto>> GetByUserAsync(int userId) =>
        await _db.Notifications.AsNoTracking().Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt).Select(x => Map(x)).ToListAsync();

    public async Task<NotificationDto> CreateAsync(CreateNotificationDto dto)
    {
        if (!await _db.Users.AnyAsync(x => x.UserId == dto.UserId))
            throw new KeyNotFoundException("User not found.");

        var e = new Notification
        {
            UserId = dto.UserId, Title = dto.Title, Message = dto.Message, IsRead = false,
            ProjectId = dto.ProjectId, ContractId = dto.ContractId, DocumentId = dto.DocumentId,
            VersionId = dto.VersionId, Type = dto.Type, CreatedAt = DateTime.UtcNow
        };
        _db.Notifications.Add(e);
        await _db.SaveChangesAsync();
        return Map(e);
    }

    public async Task<NotificationDto?> UpdateAsync(int id, UpdateNotificationDto dto)
    {
        var e = await _db.Notifications.FirstOrDefaultAsync(x => x.NotificationId == id);
        if (e == null) return null;
        e.IsRead = dto.IsRead;
        await _db.SaveChangesAsync();
        return Map(e);
    }

    public async Task DeleteAsync(int id)
    {
        var e = await _db.Notifications.FirstOrDefaultAsync(x => x.NotificationId == id)
            ?? throw new KeyNotFoundException("Notification not found.");
        _db.Notifications.Remove(e);
        await _db.SaveChangesAsync();
    }

    private static NotificationDto Map(Notification n) => new()
    {
        NotificationId = n.NotificationId, UserId = n.UserId, Title = n.Title, Message = n.Message,
        IsRead = n.IsRead, ProjectId = n.ProjectId, ContractId = n.ContractId, DocumentId = n.DocumentId,
        VersionId = n.VersionId, Type = n.Type, CreatedAt = n.CreatedAt
    };
}
