namespace DC.DAL.Models;

public class Notification
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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
