namespace DC.BLL.Dtos.ConsultantReviews;

public class ConsultantReviewDto
{
    public int ReviewId { get; set; }
    public int VersionId { get; set; }
    public int ConsultantUserId { get; set; }
    public string Rating { get; set; } = string.Empty;
    public string? Comments { get; set; }
    public DateTime ReviewDate { get; set; }
}
