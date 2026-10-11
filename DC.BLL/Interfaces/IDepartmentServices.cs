using DC.BLL.Dtos.Departments;

namespace DC.BLL.Interfaces;

public interface IDepartmentServices
{
    Task<DepartmentDto> CreateAsync(DepartmentCreateDto dto);
    Task<DepartmentDto?> UpdateAsync(int departmentId, DepartmentUpdateDto dto);
    Task<DepartmentDto?> GetByIdAsync(int departmentId);
    Task<List<DepartmentDto>> GetAllAsync(bool activeOnly = false);
    Task DeactivateAsync(int departmentId);
    Task ActivateAsync(int departmentId);
}
