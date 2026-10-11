using System.ComponentModel.DataAnnotations;

namespace DC.BLL.Dtos.ConsultantReviews;

public class CreateConsultantReviewDto
{
    [Required]
    public int VersionId { get; set; }

    [Required]
    public int ConsultantUserId { get; set; }

    [Required, MaxLength(1)]
    public string Rating { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Comments { get; set; }
}
