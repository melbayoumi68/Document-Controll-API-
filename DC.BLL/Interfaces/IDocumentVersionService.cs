using DC.BLL.Dtos.DocumentVersions;

namespace DC.BLL.Interfaces;

public interface IDocumentVersionService
{
    Task<List<DocumentVersionDto>> GetAllAsync();
    Task<DocumentVersionDto?> GetByIdAsync(int versionId);
    Task<List<DocumentVersionDto>> GetByDocumentAsync(int documentId);
    Task<DocumentVersionDto> CreateAsync(CreateDocumentVersionDto dto);
    Task<DocumentVersionDto?> UpdateAsync(int versionId, UpdateDocumentVersionDto dto);
    Task DeleteAsync(int versionId);

    /// <summary>Returns full physical path + content type + download name for a version file.</summary>
    Task<(string FullPath, string ContentType, string DownloadName)?> GetDownloadInfoAsync(int versionId);
}
