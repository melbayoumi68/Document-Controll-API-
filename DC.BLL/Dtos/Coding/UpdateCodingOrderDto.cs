namespace DC.BLL.Dtos.Coding;

public class UpdateCodingOrderDto
{
    /// <summary>
    /// قائمة مرتبة بالأجزاء الستة (بالترتيب المطلوب من الأول للأخير).
    /// يجب أن تحتوي على كل القيم الست بدون تكرار.
    /// مثال: ["ProjectCode","CategoryCode","FormAbbreviation","ContractorAbbreviation","Serial","Revision"]
    /// </summary>
    public List<string> OrderedParts { get; set; } = new();
}
