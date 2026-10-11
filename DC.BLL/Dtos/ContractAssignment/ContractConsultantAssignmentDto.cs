namespace DC.BLL.Dtos.ContractAssignment;

public class ContractConsultantAssignmentDto
{
    public int ContractConsultantId { get; set; }
    public int ContractId { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int UserId { get; set; }
    public DateTime AssignedAt { get; set; }
    public bool InvitationSent { get; set; }
    public DateTime? InvitationSentAt { get; set; }
}
