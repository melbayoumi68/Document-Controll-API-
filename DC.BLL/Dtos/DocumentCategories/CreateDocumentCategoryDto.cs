using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.DocumentCategories;

public class CreateDocumentCategoryDto
{
    [Required, MaxLength(150)]
    public string CategoryName { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string CategoryCode { get; set; } = string.Empty;
}
