using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.AuditLogs;

public class CreateAuditLogDto
{
    public int? UserId { get; set; }

    [Required, MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string EntityType { get; set; } = string.Empty;

    public int? EntityId { get; set; }

    [MaxLength(4000)]
    public string? Details { get; set; }
}
