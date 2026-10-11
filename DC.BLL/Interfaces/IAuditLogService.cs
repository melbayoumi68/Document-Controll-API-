using DC.BLL.Dtos.AuditLogs;
namespace DC.BLL.Interfaces;

public interface IAuditLogService
{
    Task<List<AuditLogDtos>> GetAllAsync();
    Task<AuditLogDtos?> GetByIdAsync(int auditLogId);
    Task<AuditLogDtos> CreateAsync(CreateAuditLogDto dto);
    Task DeleteAsync(int auditLogId);
}
