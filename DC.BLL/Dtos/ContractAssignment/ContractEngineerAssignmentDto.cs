namespace DC.BLL.Dtos.ContractAssignment;

public class ContractEngineerAssignmentDto
{
    public int ContractEngineerId { get; set; }
    public int ContractId { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public int UserId { get; set; }
    public DateTime AssignedAt { get; set; }
}
