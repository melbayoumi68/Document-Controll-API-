using DC.DAL.Models;

namespace DC.BLL.Services;

/// <summary>
/// TEMPORARY: stores and verifies passwords as plain text.
/// TODO: re-enable real hashing (PasswordHasher) before production.
/// </summary>
public class PasswordService
{
    /// <summary>Returns the password as-is (no hashing for now).</summary>
    public string HashPassword(User user, string plainPassword)
        => plainPassword;

    /// <summary>Compares plain text passwords.</summary>
    public bool VerifyPassword(User user, string plainPassword)
    {
        if (string.IsNullOrEmpty(user.PasswordHash) || plainPassword == null)
            return false;

        return user.PasswordHash == plainPassword;
    }
}
