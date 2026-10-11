using DC.BLL.Dtos.Email;

namespace DC.BLL.Interfaces;

public interface IEmailTemplateService
{
    EmailMessageDto BuildDocumentSubmitted(
        IEnumerable<string> recipients,
        string documentNumber,
        string title,
        int documentId);

    EmailMessageDto BuildRevisionUploaded(
        IEnumerable<string> recipients,
        string documentNumber,
        string title,
        string versionNumber,
        int documentId);

    EmailMessageDto BuildConsultantReview(
        IEnumerable<string> recipients,
        string documentNumber,
        string title,
        string rating,
        string? comments,
        int documentId);

    EmailMessageDto BuildContractAssignment(
        IEnumerable<string> recipients,
        string projectName,
        string contractName,
        string role,
        int projectId,
        int contractId);
}
