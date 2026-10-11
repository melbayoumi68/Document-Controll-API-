namespace DC.DAL.Models;


public class ConsultantReview
{
    public int ReviewId { get; set; }
    public int VersionId { get; set; }
    public int ConsultantUserId { get; set; }
    public string Rating { get; set; } = string.Empty; // A B C D
    public string? Comments { get; set; }
    public DateTime ReviewDate { get; set; } = DateTime.UtcNow;

    public DocumentVersion Version { get; set; } = null!;
    public User ConsultantUser { get; set; } = null!;
    
}