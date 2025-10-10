using Azure.Identity;

namespace Api.Extensions;

public static class ConfigurationExtensions
{
    public static WebApplicationBuilder AddKeyVaultConfiguration(this WebApplicationBuilder builder)
    {
        if (builder.Environment.IsProduction())
        {
            var keyVaultEndpoint = builder.Configuration["KeyVault:Endpoint"];
            
            if (!string.IsNullOrEmpty(keyVaultEndpoint))
            {
                try
                {
                    builder.Configuration.AddAzureKeyVault(
                        new Uri(keyVaultEndpoint),
                        new DefaultAzureCredential());
                    
                    builder.Logging.AddConsole().AddDebug();
                    Console.WriteLine($"✅ Successfully connected to Azure Key Vault: {keyVaultEndpoint}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"⚠️ Warning: Could not connect to Key Vault: {ex.Message}");
                    Console.WriteLine("Application will continue using configuration from App Settings as fallback.");
                }
            }
            else
            {
                Console.WriteLine("ℹ️ Key Vault endpoint not configured. Using App Settings for configuration.");
            }
        }
        
        return builder;
    }
}
