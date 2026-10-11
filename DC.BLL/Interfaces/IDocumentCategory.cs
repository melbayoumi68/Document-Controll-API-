using DC.BLL.Dtos.DocumentCategories;

namespace DC.BLL.Interfaces;

public interface IDocumentCategory
{
    Task<DocumentCategoryDto> CreateAsync(CreateDocumentCategoryDto dto);
    Task<DocumentCategoryDto?> UpdateAsync(int documentCategoryId, UpdateDocumentCategoryDto dto);
    Task<DocumentCategoryDto?> GetByIdAsync(int documentCategoryId);
    Task<List<DocumentCategoryDto>> GetAllAsync();
    /// <summary>Active categories linked to the given document type (for Submit Document filter).</summary>
    Task<List<DocumentCategoryDto>> GetByDocumentTypeIdAsync(int documentTypeId);
    Task DeactivateAsync(int documentCategoryId);
    Task ActivateAsync(int documentCategoryId);
}
