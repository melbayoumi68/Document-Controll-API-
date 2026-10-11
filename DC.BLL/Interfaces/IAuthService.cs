using DC.BLL.Dtos.Auth;

namespace DC.BLL.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto dto);
    Task ChangeMyPasswordAsync(int userId, ChangeMyPasswordDto dto);
}
