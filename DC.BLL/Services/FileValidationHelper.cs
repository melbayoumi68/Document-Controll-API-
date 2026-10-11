using Microsoft.AspNetCore.Http;

namespace DC.BLL.Services;

/// <summary>
/// Basic file type and size validation for document uploads.
/// </summary>
public static class FileValidationHelper
{
    // 25 MB
    public const long MaxFileSizeBytes = 25L * 1024 * 1024;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".xls", ".xlsx",
        ".dwg", ".dxf", ".jpg", ".jpeg", ".png",
        ".zip", ".rar", ".txt"
    };

    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "application/zip",
        "application/x-zip-compressed",
        "application/x-rar-compressed",
        "text/plain",
        "application/octet-stream" // DWG and some CAD tools
    };

    public static void Validate(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new InvalidOperationException("File is required.");

        if (file.Length > MaxFileSizeBytes)
            throw new InvalidOperationException(
                $"File size exceeds the maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB.");

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
            throw new InvalidOperationException(
                $"File type '{extension}' is not allowed. Allowed: {string.Join(", ", AllowedExtensions)}");

        // ContentType check is soft: some browsers send octet-stream for CAD files
        if (!string.IsNullOrWhiteSpace(file.ContentType) &&
            !AllowedContentTypes.Contains(file.ContentType) &&
            !AllowedExtensions.Contains(extension))
        {
            throw new InvalidOperationException(
                $"Content type '{file.ContentType}' is not allowed.");
        }
    }
}
