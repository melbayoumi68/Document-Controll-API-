namespace DC.BLL.Dtos.Notifications;

public class NotificationDto
{
    public int NotificationId { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public int? ProjectId { get; set; }
    public int? ContractId { get; set; }
    public int? DocumentId { get; set; }
    public int? VersionId { get; set; }
    public string? Type { get; set; }
    public DateTime CreatedAt { get; set; }
}
