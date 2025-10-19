using System.Security.Claims;
using System.Text;
using Api.Authentication;
using Api.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Tokens;

namespace Api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddAuthenticationAndAuthorization(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>();
        if (jwtSettings == null || string.IsNullOrWhiteSpace(jwtSettings.Secret))
        {
            throw new InvalidOperationException("JWT settings are not properly configured");
        }

        var key = Encoding.UTF8.GetBytes(jwtSettings.Secret);

        // Configure JWT Bearer Authentication with both MSAL and Guest tokens
        var authBuilder = services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme);

        // Add Microsoft Identity Web API (MSAL tokens)
        authBuilder.AddMicrosoftIdentityWebApi(options =>
        {
            configuration.Bind("AzureAd", options);

            // Map the role claim type to ClaimTypes.Role for proper authorization
            options.TokenValidationParameters.RoleClaimType = ClaimTypes.Role;

            // Configure to accept both MSAL tokens and guest tokens
            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = context =>
                {
                    // Add logging for authenticated users
                    var userId = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? context.Principal?.FindFirst("sub")?.Value
                        ?? context.Principal?.FindFirst("oid")?.Value;

                    if (!string.IsNullOrEmpty(userId))
                    {
                        var logger = context.HttpContext.RequestServices
                            .GetRequiredService<ILogger<Program>>();
                        logger.LogDebug("[AUTH] MSAL token validated for user {UserId}", userId);
                    }

                    return Task.CompletedTask;
                }
            };
        },
        options =>
        {
            configuration.Bind("AzureAd", options);
        });

        // Add support for guest JWT tokens
        authBuilder.AddJwtBearer("GuestScheme", options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ClockSkew = TimeSpan.FromMinutes(5)
            };

            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = context =>
                {
                    var isGuest = context.Principal?.FindFirst("guest")?.Value == "true";
                    if (isGuest)
                    {
                        var guestSessionId = context.Principal?.FindFirst("guestSessionId")?.Value;
                        var logger = context.HttpContext.RequestServices
                            .GetRequiredService<ILogger<Program>>();
                        logger.LogDebug("[AUTH] Guest token validated for session {GuestSessionId}", guestSessionId);
                    }
                    return Task.CompletedTask;
                },
                OnAuthenticationFailed = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<Program>>();
                    logger.LogDebug(context.Exception, "[AUTH] Guest token authentication failed");
                    return Task.CompletedTask;
                }
            };
        });

        // Configure authorization policies
        services.AddAuthorization(options =>
        {
            // Policy for endpoints that accept both authenticated users and guests
            options.AddPolicy("GuestOrAuthenticated", policy =>
            {
                policy.AddAuthenticationSchemes(
                    JwtBearerDefaults.AuthenticationScheme,
                    "GuestScheme");
                policy.RequireAuthenticatedUser();
            });

            // Policy for guest-only endpoints
            options.AddPolicy("GuestOnly", policy =>
            {
                policy.AddAuthenticationSchemes("GuestScheme");
                policy.RequireAuthenticatedUser();
                policy.AddRequirements(new GuestOnlyRequirement());
            });
        });

        // Register the guest-only authorization handler
        services.AddScoped<IAuthorizationHandler, GuestOnlyAuthorizationHandler>();

        return services;
    }
}
