using DC.DAL.Data;
using DC.BLL.Dtos.Users;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class UserServices : IUserService
{
    private readonly AppDbContext _db;
    private readonly PasswordService _passwords;
    private readonly AuditHelper _audit;

    public UserServices(AppDbContext db, PasswordService passwords, AuditHelper audit)
    {
        _db = db;
        _passwords = passwords;
        _audit = audit;
    }

    private static bool IsValidRole(string role) =>
        role == Roles.SuperAdmin || role == Roles.ToEngineer || role == Roles.Consultant;

    public async Task<List<UserDto>> GetAllAsync(bool activeOnly = false)
    {
        var q = _db.Users.AsNoTracking().AsQueryable();
        if (activeOnly) q = q.Where(x => x.IsActive);
        return await q.OrderBy(x => x.UserId).Select(x => Map(x)).ToListAsync();
    }

    public async Task<UserDto?> GetByIdAsync(int userId)
    {
        var u = await _db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId);
        return u == null ? null : Map(u);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        var username = dto.Username.Trim();
        var email = dto.Email.Trim();
        var role = dto.Role.Trim();

        if (!IsValidRole(role))
            throw new InvalidOperationException("Invalid user role.");

        if (await _db.Users.AnyAsync(x => x.Username.ToUpper() == username.ToUpper()))
            throw new InvalidOperationException("Username already exists.");

        if (await _db.Users.AnyAsync(x => x.Email.ToUpper() == email.ToUpper()))
            throw new InvalidOperationException("Email already exists.");

        if (dto.DepartmentId.HasValue &&
            !await _db.Departments.AnyAsync(x => x.DepartmentId == dto.DepartmentId.Value))
            throw new KeyNotFoundException("Department not found.");

        var user = new User
        {
            Username = username,
            Email = email,
            FullName = dto.FullName.Trim(),
            Role = role,
            DepartmentId = dto.DepartmentId,
            IsActive = true,
            MustSetPassword = false,
            FailedLoginAttempts = 0,
            IsLocked = false,
            CreatedAt = DateTime.UtcNow
        };

        // Hash before save — never store plain text
        user.PasswordHash = _passwords.HashPassword(user, dto.Password);

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        await _audit.LogAsync(user.UserId, "Create", "User", user.UserId, $"Created user {user.Username}");

        return Map(user);
    }

    public async Task<UserDto?> UpdateAsync(int userId, UpdateUserDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId);
        if (user == null) return null;

        var email = dto.Email.Trim();
        var role = dto.Role.Trim();

        if (!IsValidRole(role))
            throw new InvalidOperationException("Invalid user role.");

        if (await _db.Users.AnyAsync(x => x.UserId != userId && x.Email.ToUpper() == email.ToUpper()))
            throw new InvalidOperationException("Email already exists.");

        if (dto.DepartmentId.HasValue &&
            !await _db.Departments.AnyAsync(x => x.DepartmentId == dto.DepartmentId.Value))
            throw new KeyNotFoundException("Department not found.");

        user.Email = email;
        user.FullName = dto.FullName.Trim();
        user.Role = role;
        user.DepartmentId = dto.DepartmentId;
        user.IsActive = dto.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Map(user);
    }

    public async Task DeactivateAsync(int userId)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId)
            ?? throw new KeyNotFoundException("User not found.");
        u.IsActive = false;
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(userId, "Deactivate", "User", userId, null);
    }

    public async Task ActivateAsync(int userId)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId)
            ?? throw new KeyNotFoundException("User not found.");
        u.IsActive = true;
        u.IsLocked = false;
        u.FailedLoginAttempts = 0;
        u.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _audit.LogAsync(userId, "Activate", "User", userId, null);
    }

    /// <summary>
    /// Admin-style password reset (by userId).
    /// Phase 2 will restrict this to SuperAdmin only.
    /// </summary>
    public async Task ChangePasswordAsync(int userId, ChangePasswordDto dto)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.UserId == userId)
            ?? throw new KeyNotFoundException("User not found.");

        u.PasswordHash = _passwords.HashPassword(u, dto.NewPassword);
        u.MustSetPassword = true; // force user to set their own password later if desired
        u.FailedLoginAttempts = 0;
        u.IsLocked = false;
        u.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _audit.LogAsync(userId, "AdminResetPassword", "User", userId, "Password reset by admin endpoint");
    }

    private static UserDto Map(User u) => new()
    {
        UserId = u.UserId,
        Username = u.Username,
        Email = u.Email,
        FullName = u.FullName,
        Role = u.Role,
        DepartmentId = u.DepartmentId,
        IsActive = u.IsActive,
        CreatedAt = u.CreatedAt
        // PasswordHash intentionally never mapped
    };

    public async Task<(bool Success, string Message, int StatusCode)> DeleteAsync(int userId)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(x => x.UserId == userId);

        if (user == null)
            return (false, "User not found.", 404);

        var isAssignedToContract =
            await _db.ContractEngineers.AnyAsync(x => x.UserId == userId) ||
            await _db.ContractConsultants.AnyAsync(x => x.UserId == userId);

        if (isAssignedToContract)
            return (false, "Cannot delete this user because the user is assigned to a contract.", 409);

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return (true, "User deleted successfully.", 200);
    }
}
