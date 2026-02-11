using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace Api.Extensions;

public static class RateLimitingExtensions
{
    public const string GuestTokenPolicy = "guest-token";
    public const string PaymentCreatePolicy = "payment-create";
    public const string GlobalPolicy = "global-default";

    public static IServiceCollection AddRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            // Global default: 300 req/min per IP — generous safety net for shared networks
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 300,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));

            // Guest token: 10 req/min per IP
            options.AddFixedWindowLimiter(GuestTokenPolicy, limiterOptions =>
            {
                limiterOptions.PermitLimit = 10;
                limiterOptions.Window = TimeSpan.FromMinutes(1);
                limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
                limiterOptions.QueueLimit = 0;
            });

            // Payment intent creation: 5 req/min per authenticated user
            options.AddPolicy(PaymentCreatePolicy, context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? context.User.FindFirst("sub")?.Value
                        ?? context.Connection.RemoteIpAddress?.ToString()
                        ?? "unknown",
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                        QueueLimit = 0
                    }));
        });

        return services;
    }

    public static IApplicationBuilder UseApiRateLimiting(this IApplicationBuilder app)
    {
        app.UseRateLimiter();
        return app;
    }
}
