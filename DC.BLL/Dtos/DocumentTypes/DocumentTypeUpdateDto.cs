using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.DocumentTypes;

public class DocumentTypeUpdateDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Abbreviation { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    /// <summary>Optional list of category IDs. When provided, replaces the full link set.</summary>
    public List<int>? CategoryIds { get; set; }
}
