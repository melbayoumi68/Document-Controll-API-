namespace DC.BLL.Dtos.Email;

public class EmailOptions
{
    public const string SectionName = "Email";

    public bool Enabled { get; set; } = false;
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string FromName { get; set; } = "Technical Office Document Control";
    public bool EnableSsl { get; set; } = true;
    public string BaseUrl { get; set; } = "https://app.example.com";
}
