namespace DC.BLL.Dtos.ContractAssignment;

public class ContractAssignmentDto
{
    public int ContractId { get; set; }
    public List<ContractEngineerAssignmentDto> Engineers { get; set; } = new();
    public List<ContractConsultantAssignmentDto> Consultants { get; set; } = new();
}
