using DC.BLL.Interfaces;
using DC.DAL.Data;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

/// <summary>
/// توليد رقم المستند حسب الترتيب الديناميكي المحفوظ في DocumentCodingOrders.
/// الأجزاء الستة ثابتة؛ الترتيب فقط قابل للتغيير من Super Admin.
/// مثال افتراضي: BLOCK-46 / DOS / ATC / ARCH / 0001 / 01
/// First Revision/Version = 01 (per Document Business Logic).
/// </summary>
public class DocumentNumberingService
{
    private readonly AppDbContext _db;
    private readonly IDocumentCodingOrderService _codingOrder;

    public DocumentNumberingService(AppDbContext db, IDocumentCodingOrderService codingOrder)
    {
        _db = db;
        _codingOrder = codingOrder;
    }

    public async Task<(string SerialNumber, string DocumentNumber)> GenerateAsync(
        int contractId,
        int documentTypeId,
        int documentCategoryId,
        int? contractorId)
    {
        var values = await ResolvePartValuesAsync(contractId, documentTypeId, documentCategoryId, contractorId);

        var existingSerials = await _db.Documents
            .Where(d =>
                d.ContractId == contractId &&
                d.DocumentTypeId == documentTypeId &&
                d.DocumentCategoryId == documentCategoryId &&
                d.ContractorId == contractorId)
            .Select(d => d.SerialNumber)
            .ToListAsync();

        int next = 1;
        if (existingSerials.Count > 0)
        {
            next = existingSerials
                .Select(s => int.TryParse(s, out var n) ? n : 0)
                .DefaultIfEmpty(0)
                .Max() + 1;
        }

        var serial = next.ToString("D4");
        var revision = "01"; // first version always 01

        values[CodingPart.Serial] = serial;
        values[CodingPart.Revision] = revision;

        var documentNumber = await BuildNumberAsync(values);
        return (serial, documentNumber);
    }

    public async Task<string> BuildForRevisionAsync(
        int contractId,
        int documentTypeId,
        int documentCategoryId,
        int? contractorId,
        string serialNumber,
        string revision)
    {
        var values = await ResolvePartValuesAsync(contractId, documentTypeId, documentCategoryId, contractorId);
        values[CodingPart.Serial] = serialNumber;
        values[CodingPart.Revision] = revision;
        return await BuildNumberAsync(values);
    }

    /// <summary>01 → 02 → 03 ...</summary>
    public static string NextVersionNumber(string current)
    {
        if (int.TryParse(current, out var n))
            return (n + 1).ToString("D2");

        return "01";
    }

    /// <summary>
    /// يبني الرقم حسب الترتيب الديناميكي الحالي من قاعدة البيانات.
    /// </summary>
    public async Task<string> BuildNumberAsync(IReadOnlyDictionary<CodingPart, string> values)
    {
        var order = await _codingOrder.GetOrderedPartsAsync();
        var segments = order.Select(part =>
            values.TryGetValue(part, out var v) && !string.IsNullOrWhiteSpace(v) ? v : "NA");
        return string.Join(" / ", segments);
    }

    /// <summary>
    /// نسخة متزامنة عندما يكون الترتيب معروفاً مسبقاً (مثلاً من كاش أو اختبارات).
    /// </summary>
    public static string BuildNumber(
        IReadOnlyList<CodingPart> order,
        IReadOnlyDictionary<CodingPart, string> values)
    {
        var segments = order.Select(part =>
            values.TryGetValue(part, out var v) && !string.IsNullOrWhiteSpace(v) ? v : "NA");
        return string.Join(" / ", segments);
    }

    private async Task<Dictionary<CodingPart, string>> ResolvePartValuesAsync(
        int contractId,
        int documentTypeId,
        int documentCategoryId,
        int? contractorId)
    {
        var contract = await _db.Contracts
            .Include(c => c.Project)
            .FirstOrDefaultAsync(c => c.ContractId == contractId)
            ?? throw new KeyNotFoundException("Contract not found.");

        var docType = await _db.DocumentTypes
            .FirstOrDefaultAsync(t => t.TypeId == documentTypeId)
            ?? throw new KeyNotFoundException("Document type not found.");

        var category = await _db.DocumentCategories
            .FirstOrDefaultAsync(c => c.CategoryId == documentCategoryId)
            ?? throw new KeyNotFoundException("Document category not found.");

        var contractorAbbr = "NA";
        if (contractorId.HasValue)
        {
            var contractor = await _db.Contractors
                .FirstOrDefaultAsync(c => c.ContractorId == contractorId.Value)
                ?? throw new KeyNotFoundException("Contractor not found.");
            contractorAbbr = contractor.Abbreviation;
        }

        return new Dictionary<CodingPart, string>
        {
            [CodingPart.ProjectCode] = contract.Project.ProjectCode,
            [CodingPart.FormAbbreviation] = docType.TypeAbbreviation,
            [CodingPart.ContractorAbbreviation] = contractorAbbr,
            [CodingPart.CategoryCode] = category.CategoryCode,
            // Serial و Revision يُعيَّنان لاحقاً في Generate / BuildForRevision
            [CodingPart.Serial] = string.Empty,
            [CodingPart.Revision] = string.Empty
        };
    }
}
