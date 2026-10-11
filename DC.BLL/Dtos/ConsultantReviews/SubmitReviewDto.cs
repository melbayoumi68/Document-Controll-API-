using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.ConsultantReviews;

/// <summary>
/// Consultant submits a review for a document version.
/// Rating: A, B, C, or D
/// </summary>
public class SubmitReviewDto
{
    [Required]
    public int VersionId { get; set; }

    [Required]
    public int ConsultantUserId { get; set; }

    [Required]
    [MaxLength(1)]
    public string Rating { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Comments { get; set; }
}
