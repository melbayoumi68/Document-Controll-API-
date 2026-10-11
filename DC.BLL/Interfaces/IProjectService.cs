using DC.BLL.Dtos.Projects;

namespace DC.BLL.Interfaces;

public interface IProjectService
{
    Task<ProjectResponseDto> CreateAsync(ProjectCreateDto dto, int createdByUserId);
    Task<ProjectResponseDto?> UpdateAsync(int projectId, ProjectUpdateDto dto);
    Task<ProjectResponseDto?> GetByIdAsync(int projectId);
    Task<List<ProjectResponseDto>> GetAllAsync(bool activeOnly = false);
    Task DeactivateAsync(int projectId);
    Task ActivateAsync(int projectId);
    Task DeleteAsync(int projectId);
}
