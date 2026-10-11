namespace DC.BLL.Dtos.DocumentCategories;

public class DocumentCategoryDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategoryCode { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
