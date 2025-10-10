using Microsoft.AspNetCore.HttpOverrides;

namespace Api.Extensions;

public static class MiddlewareExtensions
{
    public static IApplicationBuilder ConfigureMiddleware(this WebApplication app)
    {
        // Development-specific middleware
        app.UseSwaggerDevelopment();

        // Production-specific middleware
        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
        }

        // CORS
        app.UseCorsPolicy();

        // Forwarded headers
        app.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
        });

        // HTTPS redirection is handled by Azure App Service in production
        // Only use it in development to avoid warnings
        if (app.Environment.IsDevelopment())
        {
            app.UseHttpsRedirection();
        }

        // Authentication must come before Authorization
        app.UseAuthentication();
        app.UseAuthorization();

        // Map controllers
        app.MapControllers();

        return app;
    }
}
