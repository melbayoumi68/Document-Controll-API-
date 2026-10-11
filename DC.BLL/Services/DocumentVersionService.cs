using DC.DAL.Data;
using DC.BLL.Dtos.DocumentVersions;
using DC.BLL.Interfaces;
using DC.DAL.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;

namespace DC.BLL.Services;

public class DocumentVersionService : IDocumentVersionService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public DocumentVersionService(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    public async Task<List<DocumentVersionDto>> GetAllAsync() =>
        await _db.DocumentVersions.AsNoTracking()
            .OrderBy(x => x.VersionId)
            .Select(x => Map(x))
            .ToListAsync();

    public async Task<DocumentVersionDto?> GetByIdAsync(int id)
    {
        var e = await _db.DocumentVersions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.VersionId == id);
        return e == null ? null : Map(e);
    }

    public async Task<List<DocumentVersionDto>> GetByDocumentAsync(int documentId) =>
        await _db.DocumentVersions.AsNoTracking()
            .Where(x => x.DocumentId == documentId)
            .OrderBy(x => x.VersionId)
            .Select(x => Map(x))
            .ToListAsync();

    public async Task<DocumentVersionDto> CreateAsync(CreateDocumentVersionDto dto)
    {
        if (!await _db.Documents.AnyAsync(x => x.DocumentId == dto.DocumentId))
            throw new KeyNotFoundException("Document not found.");
        if (!await _db.Users.AnyAsync(x => x.UserId == dto.UploadedByUserId))
            throw new KeyNotFoundException("User not found.");
        if (await _db.DocumentVersions.AnyAsync(x =>
                x.DocumentId == dto.DocumentId && x.VersionNumber == dto.VersionNumber))
            throw new InvalidOperationException("Version number already exists for this document.");

        var e = new DocumentVersion
        {
            DocumentId = dto.DocumentId,
            VersionNumber = dto.VersionNumber,
            FileName = dto.FileName,
            FilePath = dto.FilePath,
            FileContentType = dto.FileContentType,
            FileSizeBytes = dto.FileSizeBytes,
            UploadedByUserId = dto.UploadedByUserId,
            UploadedAt = DateTime.UtcNow,
            ReviewStatus = DocumentStatuses.PendingReview,
            Notes = dto.Notes
        };

        _db.DocumentVersions.Add(e);
        await _db.SaveChangesAsync();
        return Map(e);
    }

    public async Task<DocumentVersionDto?> UpdateAsync(int id, UpdateDocumentVersionDto dto)
    {
        var e = await _db.DocumentVersions.FirstOrDefaultAsync(x => x.VersionId == id);
        if (e == null) return null;

        e.FileName = dto.FileName;
        e.FilePath = dto.FilePath;
        e.FileContentType = dto.FileContentType;
        e.FileSizeBytes = dto.FileSizeBytes;
        e.Notes = dto.Notes;
        if (!string.IsNullOrWhiteSpace(dto.ReviewStatus))
            e.ReviewStatus = dto.ReviewStatus!;

        await _db.SaveChangesAsync();
        return Map(e);
    }

    public async Task DeleteAsync(int id)
    {
        var e = await _db.DocumentVersions.FirstOrDefaultAsync(x => x.VersionId == id)
            ?? throw new KeyNotFoundException("Document version not found.");
        _db.DocumentVersions.Remove(e);
        await _db.SaveChangesAsync();
    }

    public async Task<(string FullPath, string ContentType, string DownloadName)?> GetDownloadInfoAsync(int versionId)
    {
        var version = await _db.DocumentVersions.AsNoTracking()
            .FirstOrDefaultAsync(x => x.VersionId == versionId);

        if (version == null)
            return null;

        if (string.IsNullOrWhiteSpace(version.FilePath))
            throw new InvalidOperationException("No file is attached to this version.");

        var fullPath = Path.Combine(_env.ContentRootPath, version.FilePath.Replace('/', Path.DirectorySeparatorChar));

        if (!File.Exists(fullPath))
            throw new KeyNotFoundException("File not found on server.");

        var contentType = string.IsNullOrWhiteSpace(version.FileContentType)
            ? "application/octet-stream"
            : version.FileContentType;

        var downloadName = string.IsNullOrWhiteSpace(version.FileName)
            ? Path.GetFileName(fullPath)
            : version.FileName;

        return (fullPath, contentType, downloadName);
    }

    private static DocumentVersionDto Map(DocumentVersion v) => new()
    {
        VersionId = v.VersionId,
        DocumentId = v.DocumentId,
        VersionNumber = v.VersionNumber,
        FileName = v.FileName,
        FilePath = v.FilePath,
        FileContentType = v.FileContentType,
        FileSizeBytes = v.FileSizeBytes,
        UploadedByUserId = v.UploadedByUserId,
        UploadedAt = v.UploadedAt,
        ReviewStatus = v.ReviewStatus,
        Notes = v.Notes
    };
}
