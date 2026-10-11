using DC.DAL.Data;
using DC.BLL.Dtos.Projects;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _db;

    public ProjectService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ProjectResponseDto> CreateAsync(ProjectCreateDto dto, int createdByUserId)
    {
        var exists = await _db.Projects.AnyAsync(p => p.ProjectCode == dto.ProjectCode);
        if (exists)
            throw new InvalidOperationException("Project code already exists.");

        var project = new Project
        {
            ProjectName = dto.ProjectName,
            ProjectCode = dto.ProjectCode,
            Region = dto.Region,
            Description = dto.Description,
            IsActive = true,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        return Map(project, 0);
    }

    public async Task<ProjectResponseDto?> UpdateAsync(int projectId, ProjectUpdateDto dto)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);
        if (project == null) return null;

        project.ProjectName = dto.ProjectName;
        project.Region = dto.Region;
        project.Description = dto.Description;
        project.IsActive = dto.IsActive;
        project.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var count = await _db.Contracts.CountAsync(c => c.ProjectId == projectId);
        return Map(project, count);
    }

    public async Task<ProjectResponseDto?> GetByIdAsync(int projectId)
    {
        var project = await _db.Projects.AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProjectId == projectId);
        if (project == null) return null;

        var count = await _db.Contracts.CountAsync(c => c.ProjectId == projectId);
        return Map(project, count);
    }

    public async Task<List<ProjectResponseDto>> GetAllAsync(bool activeOnly = false)
    {
        var query = _db.Projects.AsNoTracking().AsQueryable();
        if (activeOnly) query = query.Where(p => p.IsActive);

        var projects = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        var result = new List<ProjectResponseDto>();

        foreach (var p in projects)
        {
            var count = await _db.Contracts.CountAsync(c => c.ProjectId == p.ProjectId);
            result.Add(Map(p, count));
        }

        return result;
    }

    public async Task DeactivateAsync(int projectId)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        project.IsActive = false;
        project.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task ActivateAsync(int projectId)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId);
        if (project == null) throw new KeyNotFoundException("Project not found.");

        project.IsActive = true;
        project.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static ProjectResponseDto Map(Project p, int contractsCount) => new()
    {
        ProjectId = p.ProjectId,
        ProjectName = p.ProjectName,
        ProjectCode = p.ProjectCode,
        Region = p.Region,
        Description = p.Description,
        IsActive = p.IsActive,
        ContractsCount = contractsCount,
        CreatedByUserId = p.CreatedByUserId,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt
    };

    public async Task DeleteAsync(int projectId)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == projectId)
        ?? throw new KeyNotFoundException("Project not found.");

        // Notifications مفيش عليها FK cascade
        var notifications = await _db.Notifications.Where(n => n.ProjectId == projectId).ToListAsync();
        if (notifications.Count > 0)
            _db.Notifications.RemoveRange(notifications);

        _db.Projects.Remove(project);   // ← الباقي SQL Server بيعمله بالـ CASCADE
        await _db.SaveChangesAsync();

    }
}
