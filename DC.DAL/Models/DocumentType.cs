namespace DC.DAL.Models;

public class DocumentType
{
    public int TypeId { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string TypeAbbreviation { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<DocumentTypeCategory> DocumentTypeCategories { get; set; }
        = new List<DocumentTypeCategory>();
}
