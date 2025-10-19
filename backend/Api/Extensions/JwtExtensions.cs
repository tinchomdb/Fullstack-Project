using Api.Configuration;
using Api.Services;

namespace Api.Extensions;

public static class JwtExtensions
{
    public static IServiceCollection AddJwtTokenService(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure JWT settings
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        // Register JWT token service
        services.AddSingleton<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
