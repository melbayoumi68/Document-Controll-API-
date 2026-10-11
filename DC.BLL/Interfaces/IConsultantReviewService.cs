using DC.BLL.Dtos.ConsultantReviews;

namespace DC.BLL.Interfaces;

public interface IConsultantReviewService
{
    Task<List<ConsultantReviewDto>> GetAllAsync();
    Task<ConsultantReviewDto?> GetByIdAsync(int reviewId);
    Task<List<ConsultantReviewDto>> GetByVersionAsync(int versionId);
    Task<ConsultantReviewDto> CreateAsync(CreateConsultantReviewDto dto);
    Task<ConsultantReviewDto?> UpdateAsync(int reviewId, UpdateConsultantReviewDto dto);
    Task DeleteAsync(int reviewId);

    /// <summary>
    /// Consultant review workflow:
    /// A = Approved, B = ApprovedWithComments, C = RequiresRevision, D = Rejected
    /// Updates Version.ReviewStatus and Document.Status
    /// </summary>
    Task<ConsultantReviewDto> SubmitReviewAsync(SubmitReviewDto dto);
}
