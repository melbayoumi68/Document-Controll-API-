using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.DocumentTypes;

public class AssignCategoriesToTypeDto
{
    [Required]
    public List<int> CategoryIds { get; set; } = new();
}
