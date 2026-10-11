using DC.BLL.Dtos.Email;
using DC.BLL.Interfaces;
using Microsoft.Extensions.Options;

namespace DC.BLL.Services;

public class EmailTemplateService : IEmailTemplateService
{
    private readonly EmailOptions _options;

    public EmailTemplateService(IOptions<EmailOptions> options)
    {
        _options = options.Value;
    }

    public EmailMessageDto BuildDocumentSubmitted(
        IEnumerable<string> recipients,
        string documentNumber,
        string title,
        int documentId)
    {
        var link = BuildDocumentLink(documentId);
        var subject = $"[DC] New document submitted: {documentNumber}";
        var shortMsg = "A new document has been submitted and is waiting for your review.";
        return Build(recipients, subject, shortMsg, documentNumber, title, null, null, link, "Open Document");
    }

    public EmailMessageDto BuildRevisionUploaded(
        IEnumerable<string> recipients,
        string documentNumber,
        string title,
        string versionNumber,
        int documentId)
    {
        var link = BuildDocumentLink(documentId);
        var subject = $"[DC] New revision uploaded: {documentNumber}";
        var shortMsg = $"A new revision (Version {versionNumber}) has been uploaded and is waiting for your review.";
        return Build(recipients, subject, shortMsg, documentNumber, title, versionNumber, null, link, "Open Document");
    }

    public EmailMessageDto BuildConsultantReview(
        IEnumerable<string> recipients,
        string documentNumber,
        string title,
        string rating,
        string? comments,
        int documentId)
    {
        var link = BuildDocumentLink(documentId);
        var (subjectPart, shortMsg) = rating switch
        {
            "A" => ("Document Approved", "Document Approved"),
            "B" => ("Document Approved with Comments", "Document Approved with Comments"),
            "C" => ("Revision Required", "Revision Required"),
            "D" => ("Document Rejected", "Document Rejected"),
            _ => ($"Review result: {rating}", $"Document reviewed with rating {rating}.")
        };

        var subject = $"[DC] {subjectPart}: {documentNumber}";
        return Build(recipients, subject, shortMsg, documentNumber, title, null, rating, link, "Open Document", comments);
    }

    public EmailMessageDto BuildContractAssignment(
        IEnumerable<string> recipients,
        string projectName,
        string contractName,
        string role,
        int projectId,
        int contractId)
    {
        var baseUrl = (_options.BaseUrl ?? "https://app.example.com").TrimEnd('/');
        var link = $"{baseUrl}/admin/projects/{projectId}/assign";
        var subject = $"[DC] You have been assigned to a contract";
        var shortMsg = $"You have been assigned as {role} on contract \"{contractName}\" (Project: {projectName}).";

        var html = $@"
<div style=""font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222;max-width:560px;"">
  <h2 style=""margin:0 0 12px;font-size:18px;color:#1a365d;"">Technical Office Document Control</h2>
  <p style=""margin:0 0 16px;"">{System.Net.WebUtility.HtmlEncode(shortMsg)}</p>
  <table style=""border-collapse:collapse;margin-bottom:20px;"">
    <tr><td style=""padding:4px 12px 4px 0;color:#555;"">Project</td><td style=""padding:4px 0;font-weight:600;"">{System.Net.WebUtility.HtmlEncode(projectName)}</td></tr>
    <tr><td style=""padding:4px 12px 4px 0;color:#555;"">Contract</td><td style=""padding:4px 0;font-weight:600;"">{System.Net.WebUtility.HtmlEncode(contractName)}</td></tr>
    <tr><td style=""padding:4px 12px 4px 0;color:#555;"">Role</td><td style=""padding:4px 0;font-weight:600;"">{System.Net.WebUtility.HtmlEncode(role)}</td></tr>
  </table>
  <p style=""margin:0 0 24px;"">
    <a href=""{link}"" style=""display:inline-block;background:#2b6cb0;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-weight:600;"">Open Contract</a>
  </p>
  <p style=""margin:0;font-size:12px;color:#888;"">This is an automated notification. Please log in to the system for details.</p>
</div>";

        var text = $@"Technical Office Document Control

{shortMsg}

Project: {projectName}
Contract: {contractName}
Role: {role}

Open Contract: {link}

This is an automated notification.";

        return new EmailMessageDto
        {
            Recipients = recipients,
            Subject = subject,
            HtmlBody = html,
            TextBody = text
        };
    }

    private EmailMessageDto Build(
        IEnumerable<string> recipients,
        string subject,
        string shortMsg,
        string documentNumber,
        string title,
        string? version,
        string? rating,
        string link,
        string buttonText,
        string? comments = null)
    {
        var rows = new System.Text.StringBuilder();
        rows.AppendLine($@"<tr><td style=""padding:4px 12px 4px 0;color:#555;"">Document Number</td><td style=""padding:4px 0;font-weight:600;"">{System.Net.WebUtility.HtmlEncode(documentNumber)}</td></tr>");
        rows.AppendLine($@"<tr><td style=""padding:4px 12px 4px 0;color:#555;"">Title</td><td style=""padding:4px 0;font-weight:600;"">{System.Net.WebUtility.HtmlEncode(title)}</td></tr>");
        if (!string.IsNullOrWhiteSpace(version))
            rows.AppendLine($@"<tr><td style=""padding:4px 12px 4px 0;color:#555;"">Revision</td><td style=""padding:4px 0;font-weight:600;"">{System.Net.WebUtility.HtmlEncode(version)}</td></tr>");
        if (!string.IsNullOrWhiteSpace(rating))
            rows.AppendLine($@"<tr><td style=""padding:4px 12px 4px 0;color:#555;"">Rating</td><td style=""padding:4px 0;font-weight:600;"">{System.Net.WebUtility.HtmlEncode(rating)}</td></tr>");
        if (!string.IsNullOrWhiteSpace(comments))
            rows.AppendLine($@"<tr><td style=""padding:4px 12px 4px 0;color:#555;vertical-align:top;"">Comments</td><td style=""padding:4px 0;"">{System.Net.WebUtility.HtmlEncode(comments)}</td></tr>");

        var html = $@"
<div style=""font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#222;max-width:560px;"">
  <h2 style=""margin:0 0 12px;font-size:18px;color:#1a365d;"">Technical Office Document Control</h2>
  <p style=""margin:0 0 16px;"">{System.Net.WebUtility.HtmlEncode(shortMsg)}</p>
  <table style=""border-collapse:collapse;margin-bottom:20px;"">
    {rows}
  </table>
  <p style=""margin:0 0 24px;"">
    <a href=""{link}"" style=""display:inline-block;background:#2b6cb0;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-weight:600;"">{System.Net.WebUtility.HtmlEncode(buttonText)}</a>
  </p>
  <p style=""margin:0;font-size:12px;color:#888;"">This is an automated notification. Please log in to the system for details.</p>
</div>";

        var textLines = new System.Text.StringBuilder();
        textLines.AppendLine("Technical Office Document Control");
        textLines.AppendLine();
        textLines.AppendLine(shortMsg);
        textLines.AppendLine();
        textLines.AppendLine($"Document Number: {documentNumber}");
        textLines.AppendLine($"Title: {title}");
        if (!string.IsNullOrWhiteSpace(version))
            textLines.AppendLine($"Revision: {version}");
        if (!string.IsNullOrWhiteSpace(rating))
            textLines.AppendLine($"Rating: {rating}");
        if (!string.IsNullOrWhiteSpace(comments))
            textLines.AppendLine($"Comments: {comments}");
        textLines.AppendLine();
        textLines.AppendLine($"{buttonText}: {link}");
        textLines.AppendLine();
        textLines.AppendLine("This is an automated notification.");

        return new EmailMessageDto
        {
            Recipients = recipients,
            Subject = subject,
            HtmlBody = html,
            TextBody = textLines.ToString()
        };
    }

    private string BuildDocumentLink(int documentId)
    {
        var baseUrl = (_options.BaseUrl ?? "https://app.example.com").TrimEnd('/');
        return $"{baseUrl}/documents/{documentId}";
    }
}
