namespace DC.DAL.Models;

public class ContractEngineer
{
    public int ContractEngineerId { get; set; }
    public int ContractId { get; set; }
    public int UserId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public Contract Contract { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class ContractConsultant
{
    public int ContractConsultantId { get; set; }
    public int ContractId { get; set; }
    public int UserId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public bool InvitationSent { get; set; }
    public DateTime? InvitationSentAt { get; set; }

    public Contract Contract { get; set; } = null!;
    public User User { get; set; } = null!;
}
