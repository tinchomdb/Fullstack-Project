using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;

namespace Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddAuthenticationAndAuthorization(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure JWT Bearer Authentication with Microsoft.Identity.Web
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddMicrosoftIdentityWebApi(options =>
            {
                configuration.Bind("AzureAd", options);

                // Map the role claim type to ClaimTypes.Role for proper authorization
                // Entra ID External uses the full claim URI in tokens
                options.TokenValidationParameters.RoleClaimType = ClaimTypes.Role;
            },
            options =>
            {
                configuration.Bind("AzureAd", options);
            });

        // Configure authorization
        services.AddAuthorization();

        return services;
    }
}
