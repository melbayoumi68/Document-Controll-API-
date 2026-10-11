namespace DC.BLL.Dtos.Email;

public class EmailMessageDto
{
    public IEnumerable<string> Recipients { get; set; } = Enumerable.Empty<string>();
    public string Subject { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string TextBody { get; set; } = string.Empty;
}
