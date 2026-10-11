using DC.BLL.Dtos.Documents;
using DC.BLL.Dtos.DocumentVersions;
using Microsoft.AspNetCore.Http;

namespace DC.BLL.Interfaces;

public interface IDocumentService
{
    Task<List<DocumentDto>> GetAllAsync();
    Task<DocumentDto?> GetByIdAsync(int documentId);
    Task<List<DocumentDto>> GetByContractAsync(int contractId);
    Task<DocumentDto> CreateAsync(CreateDocumentDto dto);
    Task<DocumentDto?> UpdateAsync(int documentId, UpdateDocumentDto dto);
    Task DeleteAsync(int documentId);

    Task<DocumentDto> SubmitAsync(SubmitDocumentDto dto, IFormFile file);
    Task<DocumentVersionDto> UploadNewVersionAsync(UploadVersionDto dto, IFormFile file);

    // Filter endpoints
    Task<List<DocumentDto>> GetByStatusAsync(string status);
    Task<List<DocumentDto>> GetPendingReviewForConsultantAsync(int consultantUserId);
    Task<List<DocumentDto>> GetRequiresRevisionForEngineerAsync(int engineerUserId);
    Task<List<DocumentDto>> GetByEngineerAsync(int engineerUserId);
    Task<List<DocumentDto>> GetByConsultantAsync(int consultantUserId);
}
