using DC.DAL.Data;
using DC.BLL.Dtos.DocumentCategories;
using DC.BLL.Dtos.DocumentTypes;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class DocumentTypeServices : IDocumentType
{
    private readonly AppDbContext _db;
    public DocumentTypeServices(AppDbContext db) { _db = db; }

    public async Task<DocumentTypeDto> CreateDocumentTypeAsync(CreateDocumentTypeDto dto)
    {
        var e = new DocumentType
        {
            TypeName = dto.Name,
            TypeAbbreviation = dto.Abbreviation,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.DocumentTypes.Add(e);
        await _db.SaveChangesAsync();

        if (dto.CategoryIds is { Count: > 0 })
            await ReplaceLinksAsync(e.TypeId, dto.CategoryIds);

        return (await GetDocumentTypeByIdAsync(e.TypeId))!;
    }

    public async Task<DocumentTypeDto?> UpdateDocumentTypeAsync(int id, DocumentTypeUpdateDto dto)
    {
        var e = await _db.DocumentTypes.FirstOrDefaultAsync(x => x.TypeId == id);
        if (e == null) return null;

        e.TypeName = dto.Name;
        e.TypeAbbreviation = dto.Abbreviation;
        e.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();

        if (dto.CategoryIds != null)
            await ReplaceLinksAsync(id, dto.CategoryIds);

        return await GetDocumentTypeByIdAsync(id);
    }

    public async Task<List<DocumentTypeDto>> GetAllDocumentTypesAsync()
    {
        var types = await _db.DocumentTypes
            .AsNoTracking()
            .OrderBy(x => x.TypeId)
            .ToListAsync();

        var typeIds = types.Select(t => t.TypeId).ToList();
        var links = await _db.DocumentTypeCategories
            .AsNoTracking()
            .Where(l => typeIds.Contains(l.DocumentTypeId))
            .Include(l => l.DocumentCategory)
            .ToListAsync();

        return types.Select(t => Map(t, links.Where(l => l.DocumentTypeId == t.TypeId).Select(l => l.DocumentCategory))).ToList();
    }

    public async Task<DocumentTypeDto?> GetDocumentTypeByIdAsync(int id)
    {
        var e = await _db.DocumentTypes.AsNoTracking().FirstOrDefaultAsync(x => x.TypeId == id);
        if (e == null) return null;

        var cats = await _db.DocumentTypeCategories
            .AsNoTracking()
            .Where(l => l.DocumentTypeId == id)
            .Include(l => l.DocumentCategory)
            .Select(l => l.DocumentCategory)
            .ToListAsync();

        return Map(e, cats);
    }

    public async Task DeactivateAsync(int id)
    {
        var e = await _db.DocumentTypes.FirstOrDefaultAsync(x => x.TypeId == id)
            ?? throw new KeyNotFoundException("Document type not found.");
        e.IsActive = false;
        await _db.SaveChangesAsync();
    }

    public async Task ActivateAsync(int id)
    {
        var e = await _db.DocumentTypes.FirstOrDefaultAsync(x => x.TypeId == id)
            ?? throw new KeyNotFoundException("Document type not found.");
        e.IsActive = true;
        await _db.SaveChangesAsync();
    }

    public async Task<List<DocumentCategoryDto>> GetCategoriesByTypeIdAsync(int typeId, bool activeOnly = true)
    {
        if (!await _db.DocumentTypes.AnyAsync(x => x.TypeId == typeId))
            throw new KeyNotFoundException("Document type not found.");

        var query = _db.DocumentTypeCategories
            .AsNoTracking()
            .Where(l => l.DocumentTypeId == typeId)
            .Select(l => l.DocumentCategory);

        if (activeOnly)
            query = query.Where(c => c.IsActive);

        return await query
            .OrderBy(c => c.CategoryCode)
            .Select(c => new DocumentCategoryDto
            {
                CategoryId = c.CategoryId,
                CategoryName = c.CategoryName,
                CategoryCode = c.CategoryCode,
                IsActive = c.IsActive
            })
            .ToListAsync();
    }

    public async Task AssignCategoriesAsync(int typeId, List<int> categoryIds)
    {
        if (!await _db.DocumentTypes.AnyAsync(x => x.TypeId == typeId))
            throw new KeyNotFoundException("Document type not found.");

        await ReplaceLinksAsync(typeId, categoryIds ?? new List<int>());
    }

    private async Task ReplaceLinksAsync(int typeId, List<int> categoryIds)
    {
        var distinctIds = categoryIds.Distinct().ToList();

        if (distinctIds.Count > 0)
        {
            var existingCount = await _db.DocumentCategories
                .CountAsync(c => distinctIds.Contains(c.CategoryId));
            if (existingCount != distinctIds.Count)
                throw new ArgumentException("One or more category IDs are invalid.");
        }

        var current = await _db.DocumentTypeCategories
            .Where(l => l.DocumentTypeId == typeId)
            .ToListAsync();
        _db.DocumentTypeCategories.RemoveRange(current);

        foreach (var catId in distinctIds)
        {
            _db.DocumentTypeCategories.Add(new DocumentTypeCategory
            {
                DocumentTypeId = typeId,
                DocumentCategoryId = catId
            });
        }

        await _db.SaveChangesAsync();
    }

    private static DocumentTypeDto Map(DocumentType d, IEnumerable<DocumentCategory>? categories = null) => new()
    {
        DocumentTypeId = d.TypeId,
        Name = d.TypeName,
        Abbreviation = d.TypeAbbreviation,
        IsActive = d.IsActive,
        Categories = (categories ?? Enumerable.Empty<DocumentCategory>())
            .Select(c => new DocumentCategoryDto
            {
                CategoryId = c.CategoryId,
                CategoryName = c.CategoryName,
                CategoryCode = c.CategoryCode,
                IsActive = c.IsActive
            })
            .ToList()
    };
}
