using DC.BLL.Dtos.Email;

namespace DC.BLL.Interfaces;

public interface IEmailService
{
    Task<bool> SendAsync(EmailMessageDto message, CancellationToken cancellationToken = default);
}
