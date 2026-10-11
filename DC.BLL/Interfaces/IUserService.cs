using DC.BLL.Dtos.Users;

namespace DC.BLL.Interfaces;

public interface IUserService
{
    Task<List<UserDto>> GetAllAsync(bool activeOnly = false);
    Task<UserDto?> GetByIdAsync(int userId);
    Task<UserDto> CreateAsync(CreateUserDto dto);
    Task<UserDto?> UpdateAsync(int userId, UpdateUserDto dto);
    Task DeactivateAsync(int userId);
    Task ActivateAsync(int userId);
    Task ChangePasswordAsync(int userId, ChangePasswordDto dto);
    Task<(bool Success, string Message, int StatusCode)> DeleteAsync(int userId);
}
