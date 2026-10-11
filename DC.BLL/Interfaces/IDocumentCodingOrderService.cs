using DC.BLL.Dtos.Coding;
using DC.DAL.Models;

namespace DC.BLL.Interfaces;

public interface IDocumentCodingOrderService
{
    /// <summary>جلب الترتيب الحالي مع التسميات (للواجهة وAPI).</summary>
    Task<IReadOnlyList<CodingOrderItemDto>> GetOrderAsync();

    /// <summary>تحديث الترتيب — Super Admin فقط.</summary>
    Task<IReadOnlyList<CodingOrderItemDto>> UpdateOrderAsync(UpdateCodingOrderDto dto);

    /// <summary>جلب الأجزاء مرتبة فقط (للاستخدام الداخلي من DocumentNumberingService).</summary>
    Task<IReadOnlyList<CodingPart>> GetOrderedPartsAsync();
}
