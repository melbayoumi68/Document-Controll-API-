using DC.DAL.Data;
using DC.BLL.Dtos.DocumentCategories;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;

namespace DC.BLL.Services;

public class DocumentCategoryServices : IDocumentCategory
{
    private readonly AppDbContext _db;
    public DocumentCategoryServices(AppDbContext db) { _db = db; }

    public async Task<DocumentCategoryDto> CreateAsync(CreateDocumentCategoryDto dto)
    {
        var e = new DocumentCategory
        {
            CategoryName = dto.CategoryName,
            CategoryCode = dto.CategoryCode,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        _db.DocumentCategories.Add(e);
        await _db.SaveChangesAsync();
        return Map(e);
    }

    public async Task<DocumentCategoryDto?> UpdateAsync(int id, UpdateDocumentCategoryDto dto)
    {
        var e = await _db.DocumentCategories.FirstOrDefaultAsync(x => x.CategoryId == id);
        if (e == null) return null;
        e.CategoryName = dto.CategoryName;
        e.CategoryCode = dto.CategoryCode;
        e.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Map(e);
    }

    public async Task<List<DocumentCategoryDto>> GetAllAsync() =>
        await _db.DocumentCategories.AsNoTracking().OrderBy(x => x.CategoryId).Select(x => Map(x)).ToListAsync();

    public async Task<DocumentCategoryDto?> GetByIdAsync(int id)
    {
        var e = await _db.DocumentCategories.AsNoTracking().FirstOrDefaultAsync(x => x.CategoryId == id);
        return e == null ? null : Map(e);
    }

    public async Task<List<DocumentCategoryDto>> GetByDocumentTypeIdAsync(int documentTypeId)
    {
        if (!await _db.DocumentTypes.AnyAsync(x => x.TypeId == documentTypeId))
            throw new KeyNotFoundException("Document type not found.");

        return await _db.DocumentTypeCategories
            .AsNoTracking()
            .Where(l => l.DocumentTypeId == documentTypeId)
            .Select(l => l.DocumentCategory)
            .Where(c => c.IsActive)
            .OrderBy(c => c.CategoryCode)
            .Select(c => Map(c))
            .ToListAsync();
    }

    public async Task DeactivateAsync(int id)
    {
        var e = await _db.DocumentCategories.FirstOrDefaultAsync(x => x.CategoryId == id)
            ?? throw new KeyNotFoundException("Document category not found.");
        e.IsActive = false;
        await _db.SaveChangesAsync();
    }

    public async Task ActivateAsync(int id)
    {
        var e = await _db.DocumentCategories.FirstOrDefaultAsync(x => x.CategoryId == id)
            ?? throw new KeyNotFoundException("Document category not found.");
        e.IsActive = true;
        await _db.SaveChangesAsync();
    }

    private static DocumentCategoryDto Map(DocumentCategory c) => new()
    {
        CategoryId = c.CategoryId,
        CategoryName = c.CategoryName,
        CategoryCode = c.CategoryCode,
        IsActive = c.IsActive
    };
}
