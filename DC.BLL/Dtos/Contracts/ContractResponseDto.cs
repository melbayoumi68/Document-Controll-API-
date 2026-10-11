namespace DC.BLL.Dtos.Contracts;

public class ContractResponseDto
{
    public int ContractId { get; set; }
    public int ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ContractName { get; set; } = string.Empty;
    public string ContractCode { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public bool IsActive { get; set; }
    public int EngineersCount { get; set; }
    public int ConsultantsCount { get; set; }
    public int DocumentsCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
