namespace DC.BLL.Dtos.Coding;

public class CodingOrderItemDto
{
    /// <summary>اسم الجزء كما في الـ enum: ProjectCode, FormAbbreviation, ...</summary>
    public string Part { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public string DisplayLabel { get; set; } = string.Empty;
}
