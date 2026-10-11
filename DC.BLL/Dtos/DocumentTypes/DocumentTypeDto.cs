using DC.BLL.Dtos.DocumentCategories;

namespace DC.BLL.Dtos.DocumentTypes;

public class DocumentTypeDto
{
    public int DocumentTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Abbreviation { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public List<DocumentCategoryDto> Categories { get; set; } = new();
}
