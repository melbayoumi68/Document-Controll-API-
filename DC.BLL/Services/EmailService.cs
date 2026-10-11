using DC.BLL.Dtos.Email;
using DC.BLL.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace DC.BLL.Services;

public class EmailService : IEmailService
{
    private readonly EmailOptions _options;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailOptions> options, ILogger<EmailService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public async Task<bool> SendAsync(EmailMessageDto message, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
        {
            _logger.LogWarning("Email sending is disabled (Email:Enabled = false). Skipping.");
            return false;
        }

        var recipients = message.Recipients?
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Select(e => e.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<string>();

        if (recipients.Count == 0)
        {
            _logger.LogWarning("Email skipped: no valid recipients.");
            return false;
        }

        if (string.IsNullOrWhiteSpace(_options.Host) || string.IsNullOrWhiteSpace(_options.From))
        {
            _logger.LogWarning("Email skipped: Host or From is not configured.");
            return false;
        }

        // Gmail App Passwords are often copied with spaces — strip them
        var password = (_options.Password ?? string.Empty).Replace(" ", "").Trim();
        var username = (_options.Username ?? string.Empty).Trim();

        try
        {
            var mime = new MimeMessage();
            mime.From.Add(new MailboxAddress(_options.FromName, _options.From.Trim()));

            foreach (var email in recipients)
                mime.To.Add(MailboxAddress.Parse(email));

            mime.Subject = message.Subject ?? string.Empty;

            var builder = new BodyBuilder();
            if (!string.IsNullOrWhiteSpace(message.HtmlBody))
                builder.HtmlBody = message.HtmlBody;
            if (!string.IsNullOrWhiteSpace(message.TextBody))
                builder.TextBody = message.TextBody;
            else if (!string.IsNullOrWhiteSpace(message.HtmlBody))
                builder.TextBody = StripHtml(message.HtmlBody);

            mime.Body = builder.ToMessageBody();

            using var client = new SmtpClient();

            // Port 465 = implicit SSL, Port 587 = STARTTLS (Gmail supports both)
            var secure = ResolveSecureOptions(_options.Port, _options.EnableSsl);

            _logger.LogInformation(
                "Connecting SMTP Host={Host} Port={Port} User={User} Secure={Secure}",
                _options.Host, _options.Port, username, secure);

            await client.ConnectAsync(_options.Host.Trim(), _options.Port, secure, cancellationToken);

            if (!string.IsNullOrWhiteSpace(username))
            {
                await client.AuthenticateAsync(username, password, cancellationToken);
            }

            await client.SendAsync(mime, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);

            _logger.LogInformation(
                "Email sent successfully to {Count} recipient(s). Subject: {Subject}",
                recipients.Count,
                message.Subject);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send email. Host={Host} Port={Port} User={User} Subject={Subject} Recipients={Recipients}",
                _options.Host,
                _options.Port,
                username,
                message.Subject,
                string.Join(", ", recipients));
            return false;
        }
    }

    private static SecureSocketOptions ResolveSecureOptions(int port, bool enableSsl)
    {
        if (!enableSsl)
            return SecureSocketOptions.None;

        // Gmail / most providers:
        // 465 → SSL on connect
        // 587 → STARTTLS
        if (port == 465)
            return SecureSocketOptions.SslOnConnect;

        return SecureSocketOptions.StartTls;
    }

    private static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html)) return string.Empty;
        var text = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ");
        text = System.Net.WebUtility.HtmlDecode(text);
        return System.Text.RegularExpressions.Regex.Replace(text, @"\s+", " ").Trim();
    }
}
