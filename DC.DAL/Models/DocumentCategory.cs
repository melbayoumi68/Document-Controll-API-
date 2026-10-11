namespace DC.DAL.Models;

public class DocumentCategory
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryCode { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<DocumentTypeCategory> DocumentTypeCategories { get; set; }
        = new List<DocumentTypeCategory>();
}
