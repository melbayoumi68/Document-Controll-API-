using DC.BLL.Dtos.Notifications;

namespace DC.BLL.Interfaces;

public interface INotificationService
{
    Task<List<NotificationDto>> GetAllAsync();
    Task<NotificationDto?> GetByIdAsync(int notificationId);
    Task<List<NotificationDto>> GetByUserAsync(int userId);
    Task<NotificationDto> CreateAsync(CreateNotificationDto dto);
    Task<NotificationDto?> UpdateAsync(int notificationId, UpdateNotificationDto dto);
    Task DeleteAsync(int notificationId);
}
