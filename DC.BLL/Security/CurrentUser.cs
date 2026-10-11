using System.Security.Claims;
using DC.DAL.Models;

namespace DC.Security;

/// <summary>
/// Reads identity from JWT claims. Never trust userId from request body.
/// </summary>
public static class CurrentUser
{
    public static int GetUserId(ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(raw) || !int.TryParse(raw, out var id))
            throw new UnauthorizedAccessException("User identity is missing from token.");

        return id;
    }

    public static string GetRole(ClaimsPrincipal user)
    {
        var role = user.FindFirstValue(ClaimTypes.Role);
        if (string.IsNullOrWhiteSpace(role))
            throw new UnauthorizedAccessException("User role is missing from token.");
        return role;
    }

    public static bool IsSuperAdmin(ClaimsPrincipal user)
        => GetRole(user) == Roles.SuperAdmin;

    public static bool IsEngineer(ClaimsPrincipal user)
        => GetRole(user) == Roles.ToEngineer;

    public static bool IsConsultant(ClaimsPrincipal user)
        => GetRole(user) == Roles.Consultant;
}
