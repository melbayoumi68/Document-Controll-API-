namespace DC.DAL.Models;

/// <summary>
/// الأجزاء الستة الرسمية لترقيم المستندات.
/// القيم ثابتة في الكود؛ الترتيب فقط يُحفظ في قاعدة البيانات (جدول DocumentCodingOrders).
/// </summary>
public enum CodingPart
{
    ProjectCode = 1,
    FormAbbreviation = 2,
    ContractorAbbreviation = 3,
    CategoryCode = 4,
    Serial = 5,
    Revision = 6
}
