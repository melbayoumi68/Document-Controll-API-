namespace DC.DAL.Models;

public class User
{
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public bool IsActive { get; set; } = true;
    public bool MustSetPassword { get; set; } = false;
    public int FailedLoginAttempts { get; set; }
    public bool IsLocked { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Department? Department { get; set; }
    public ICollection<ContractEngineer> ContractAssignments { get; set; } = new List<ContractEngineer>();
    public ICollection<ContractConsultant> ConsultantAssignments { get; set; } = new List<ContractConsultant>();
}
