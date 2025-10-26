namespace Api.Extensions;

public static class CorsExtensions
{
    private const string PolicyName = "AllowConfiguredOrigins";

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetValue<string>("AllowedOrigins")?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? [];

        services.AddCors(options =>
        {
            options.AddPolicy(PolicyName, policy =>
            {
                if (allowedOrigins.Length > 0)
                {
                    policy.WithOrigins(allowedOrigins)
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                }
                else
                {
                    // Fallback (dev) - Allow both HTTP and HTTPS for localhost
                    policy.WithOrigins(
                        "http://localhost:4200",
                        "https://localhost:4200")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                }
            });
        });

        return services;
    }

    public static IApplicationBuilder UseCorsPolicy(this IApplicationBuilder app)
    {
        // Don't apply CORS middleware globally here.
        // Instead, let endpoint routing handle it per-route.
        // Routes with [DisableCors] (like webhooks) won't be affected.
        return app;
    }
}
