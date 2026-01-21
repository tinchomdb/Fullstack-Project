namespace Infrastructure.Configuration;

public sealed class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string ConnectionString { get; init; } = string.Empty;
    public string SenderAddress { get; init; } = string.Empty;
    public string SenderName { get; init; } = string.Empty;
    public bool EnableEmailSending { get; init; } = false;
}