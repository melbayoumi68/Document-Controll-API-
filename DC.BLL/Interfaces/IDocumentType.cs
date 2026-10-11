using DC.BLL.Dtos.DocumentCategories;
using DC.BLL.Dtos.DocumentTypes;

namespace DC.BLL.Interfaces;

public interface IDocumentType
{
    Task<List<DocumentTypeDto>> GetAllDocumentTypesAsync();
    Task<DocumentTypeDto?> GetDocumentTypeByIdAsync(int id);
    Task<DocumentTypeDto> CreateDocumentTypeAsync(CreateDocumentTypeDto dto);
    Task<DocumentTypeDto?> UpdateDocumentTypeAsync(int id, DocumentTypeUpdateDto dto);
    Task DeactivateAsync(int documentTypeId);
    Task ActivateAsync(int documentTypeId);

    Task<List<DocumentCategoryDto>> GetCategoriesByTypeIdAsync(int typeId, bool activeOnly = true);
    Task AssignCategoriesAsync(int typeId, List<int> categoryIds);
}
