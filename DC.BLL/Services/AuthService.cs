using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DC.DAL.Data;
using DC.BLL.Dtos.Auth;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace DC.BLL.Services;

public class JwtSettings
{
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 60;
}

public class SecuritySettings
{
    public int MaxFailedLoginAttempts { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly PasswordService _passwords;
    private readonly JwtSettings _jwt;
    private readonly SecuritySettings _security;
    private readonly AuditHelper _audit;

    public AuthService(
        AppDbContext db,
        PasswordService passwords,
        IOptions<JwtSettings> jwt,
        IOptions<SecuritySettings> security,
        AuditHelper audit)
    {
        _db = db;
        _passwords = passwords;
        _jwt = jwt.Value;
        _security = security.Value;
        _audit = audit;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto dto)
    {
        var key = dto.UsernameOrEmail.Trim();

        var user = await _db.Users
            .FirstOrDefaultAsync(x =>
                x.Username.ToUpper() == key.ToUpper() ||
                x.Email.ToUpper() == key.ToUpper());

        if (user == null)
        {
            // generic message — do not reveal whether user exists
            throw new UnauthorizedAccessException("Invalid username/email or password.");
        }

        if (!user.IsActive)
            throw new UnauthorizedAccessException("This account is deactivated.");

        if (user.IsLocked)
            throw new UnauthorizedAccessException("This account is locked. Contact an administrator.");

        if (!_passwords.VerifyPassword(user, dto.Password))
        {
            user.FailedLoginAttempts += 1;

            if (user.FailedLoginAttempts >= _security.MaxFailedLoginAttempts)
            {
                user.IsLocked = true;
            }

            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await _audit.LogAsync(user.UserId, "LoginFailed", "User", user.UserId,
                $"Failed login attempt #{user.FailedLoginAttempts}");

            if (user.IsLocked)
                throw new UnauthorizedAccessException("This account is locked due to too many failed attempts.");

            throw new UnauthorizedAccessException("Invalid username/email or password.");
        }

        // success
        user.FailedLoginAttempts = 0;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _audit.LogAsync(user.UserId, "LoginSuccess", "User", user.UserId, "Login successful");

        var expires = DateTime.UtcNow.AddMinutes(_jwt.ExpirationMinutes);
        var token = CreateToken(user, expires);

        return new LoginResponseDto
        {
            AccessToken = token,
            ExpiresAtUtc = expires,
            UserId = user.UserId,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            MustSetPassword = user.MustSetPassword
        };
    }

    public async Task ChangeMyPasswordAsync(int userId, ChangeMyPasswordDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId)
            ?? throw new KeyNotFoundException("User not found.");

        if (!_passwords.VerifyPassword(user, dto.CurrentPassword))
            throw new UnauthorizedAccessException("Current password is incorrect.");

        if (dto.CurrentPassword == dto.NewPassword)
            throw new InvalidOperationException("New password must be different from the current password.");

        user.PasswordHash = _passwords.HashPassword(user, dto.NewPassword);
        user.MustSetPassword = false;
        user.FailedLoginAttempts = 0;
        user.IsLocked = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _audit.LogAsync(user.UserId, "ChangePassword", "User", user.UserId, "Password changed by user");
    }

    private string CreateToken(User user, DateTime expires)
    {
        if (string.IsNullOrWhiteSpace(_jwt.Key) || _jwt.Key.Length < 32)
            throw new InvalidOperationException("JWT Key is missing or too short. Configure Jwt:Key (min 32 chars).");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role),
            new("fullName", user.FullName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
