namespace DC.DAL.Models;

/// <summary>
/// صف واحد لكل جزء من أجزاء الترقيم الستة.
/// SortOrder يحدد ترتيب الظهور في DocumentNumber (1 = الأول).
/// يمكن توسيعه لاحقاً بـ ProjectId لجعله per-project إن لزم.
/// </summary>
public class DocumentCodingOrder
{
    public int Id { get; set; }

    /// <summary>الجزء (ProjectCode, FormAbbreviation, ...)</summary>
    public CodingPart Part { get; set; }

    /// <summary>الترتيب (1..6) — يجب أن يكون فريداً</summary>
    public int SortOrder { get; set; }

    /// <summary>تسمية عرض اختيارية للواجهة (إن تُركت فارغة يُستخدم الاسم الافتراضي)</summary>
    public string? DisplayLabel { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
