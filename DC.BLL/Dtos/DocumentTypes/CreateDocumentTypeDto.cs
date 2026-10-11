using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.DocumentTypes;

public class CreateDocumentTypeDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Abbreviation { get; set; } = string.Empty;

    /// <summary>Optional list of category IDs to link on create.</summary>
    public List<int>? CategoryIds { get; set; }
}
