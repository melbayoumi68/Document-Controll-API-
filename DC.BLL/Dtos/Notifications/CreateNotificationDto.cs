using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.Notifications;

public class CreateNotificationDto
{
    [Required]
    public int UserId { get; set; }

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    public int? ProjectId { get; set; }
    public int? ContractId { get; set; }
    public int? DocumentId { get; set; }
    public int? VersionId { get; set; }

    [MaxLength(50)]
    public string? Type { get; set; }
}
