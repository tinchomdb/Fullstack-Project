using Api.Configuration;
using Api.Services;

namespace Api.Extensions;

public static class EmailExtensions
{
    public static IServiceCollection AddEmailService(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Bind email configuration
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));

        var emailSettings = new EmailSettings();
        configuration.GetSection(EmailSettings.SectionName).Bind(emailSettings);

        if (emailSettings.EnableEmailSending)
        {
            // Validate Azure Communication Services connection string (should be in Key Vault)
            if (string.IsNullOrEmpty(emailSettings.ConnectionString))
            {
                throw new InvalidOperationException(
                    $"Email connection string is not configured but email sending is enabled. " +
                    $"Please set '{EmailSettings.SectionName}:{nameof(EmailSettings.ConnectionString)}' " +
                    $"in User Secrets (development) or Azure Key Vault (production), " +
                    $"or set '{EmailSettings.SectionName}:{nameof(EmailSettings.EnableEmailSending)}' to false.");
            }

            if (string.IsNullOrEmpty(emailSettings.SenderAddress))
            {
                throw new InvalidOperationException(
                    $"Email sender address is not configured. " +
                    $"Please set '{EmailSettings.SectionName}:{nameof(EmailSettings.SenderAddress)}' " +
                    $"in configuration.");
            }
        }

        // Register email service
        services.AddScoped<IEmailService, AzureEmailService>();

        return services;
    }
}
