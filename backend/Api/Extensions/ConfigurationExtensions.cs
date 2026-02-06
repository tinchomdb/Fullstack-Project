using Azure.Identity;
using Microsoft.Extensions.Logging;

namespace Api.Extensions;

public static class ConfigurationExtensions
{
    public static WebApplicationBuilder AddKeyVaultConfiguration(this WebApplicationBuilder builder)
    {
        if (builder.Environment.IsProduction())
        {
            var logger = builder.Services.BuildServiceProvider().GetRequiredService<ILogger<Program>>();
            var keyVaultEndpoint = builder.Configuration["KeyVault:Endpoint"];

            if (!string.IsNullOrEmpty(keyVaultEndpoint))
            {
                try
                {
                    builder.Configuration.AddAzureKeyVault(
                        new Uri(keyVaultEndpoint),
                        new DefaultAzureCredential());

                    logger.LogInformation("Successfully connected to Azure Key Vault: {Endpoint}", keyVaultEndpoint);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Could not connect to Key Vault. Application will continue using App Settings as fallback");
                }
            }
            else
            {
                logger.LogInformation("Key Vault endpoint not configured. Using App Settings for configuration");
            }
        }

        return builder;
    }
}
