namespace DC.DAL.Models;

/// <summary>
/// Junction entity: many-to-many between DocumentType and DocumentCategory.
/// </summary>
public class DocumentTypeCategory
{
    public int DocumentTypeId { get; set; }
    public int DocumentCategoryId { get; set; }

    public DocumentType DocumentType { get; set; } = null!;
    public DocumentCategory DocumentCategory { get; set; } = null!;
}
