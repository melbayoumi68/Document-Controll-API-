using DC.BLL.Dtos.Coding;
using DC.BLL.Interfaces;
using DC.DAL.Data;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class DocumentCodingOrderService : IDocumentCodingOrderService
{
    private readonly AppDbContext _db;

    private static readonly Dictionary<CodingPart, string> DefaultLabels = new()
    {
        [CodingPart.ProjectCode] = "Project",
        [CodingPart.FormAbbreviation] = "Form /Type",
        [CodingPart.ContractorAbbreviation] = "Contractor",
        [CodingPart.CategoryCode] = "Category",
        [CodingPart.Serial] = "Serial",
        [CodingPart.Revision] = "Revision"
    };

    public DocumentCodingOrderService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<CodingOrderItemDto>> GetOrderAsync()
    {
        var rows = await _db.DocumentCodingOrders
            .OrderBy(x => x.SortOrder)
            .AsNoTracking()
            .ToListAsync();

        if (rows.Count == 0)
            return BuildDefaultDtos();

        return rows.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<CodingPart>> GetOrderedPartsAsync()
    {
        var parts = await _db.DocumentCodingOrders
            .OrderBy(x => x.SortOrder)
            .Select(x => x.Part)
            .ToListAsync();

        if (parts.Count == 0)
            return Enum.GetValues<CodingPart>().OrderBy(p => (int)p).ToList();

        return parts;
    }

    public async Task<IReadOnlyList<CodingOrderItemDto>> UpdateOrderAsync(UpdateCodingOrderDto dto)
    {
        if (dto.OrderedParts is null || dto.OrderedParts.Count != 6)
            throw new ArgumentException("Exactly 6 parts are required.");

        var parsed = new List<CodingPart>();
        foreach (var name in dto.OrderedParts)
        {
            if (!Enum.TryParse<CodingPart>(name, ignoreCase: true, out var part))
                throw new ArgumentException($"Invalid coding part: '{name}'.");
            if (parsed.Contains(part))
                throw new ArgumentException($"Duplicate part: '{name}'.");
            parsed.Add(part);
        }

        var allRequired = Enum.GetValues<CodingPart>().ToHashSet();
        if (!allRequired.SetEquals(parsed))
            throw new ArgumentException("All six coding parts must be present exactly once.");

        var existing = await _db.DocumentCodingOrders.ToListAsync();

        if (existing.Count == 0)
        {
            for (int i = 0; i < parsed.Count; i++)
            {
                _db.DocumentCodingOrders.Add(new DocumentCodingOrder
                {
                    Part = parsed[i],
                    SortOrder = i + 1,
                    DisplayLabel = DefaultLabels[parsed[i]],
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }
        else
        {
            // مساحة مؤقتة لتجنب تعارض الـ unique index على SortOrder أثناء التحديث
            foreach (var row in existing)
                row.SortOrder = row.SortOrder + 100;

            await _db.SaveChangesAsync();

            for (int i = 0; i < parsed.Count; i++)
            {
                var row = existing.First(x => x.Part == parsed[i]);
                row.SortOrder = i + 1;
                row.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _db.SaveChangesAsync();
        return await GetOrderAsync();
    }

    private static CodingOrderItemDto ToDto(DocumentCodingOrder x) => new()
    {
        Part = x.Part.ToString(),
        SortOrder = x.SortOrder,
        DisplayLabel = string.IsNullOrWhiteSpace(x.DisplayLabel)
            ? DefaultLabels.GetValueOrDefault(x.Part, x.Part.ToString())
            : x.DisplayLabel!
    };

    private static List<CodingOrderItemDto> BuildDefaultDtos() =>
        Enum.GetValues<CodingPart>()
            .OrderBy(p => (int)p)
            .Select((p, i) => new CodingOrderItemDto
            {
                Part = p.ToString(),
                SortOrder = i + 1,
                DisplayLabel = DefaultLabels[p]
            })
            .ToList();
}
