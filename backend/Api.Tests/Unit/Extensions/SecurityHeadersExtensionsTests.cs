using Api.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Hosting;

namespace Api.Tests.Unit.Extensions;

public class SecurityHeadersExtensionsTests
{
    [Fact]
    public async Task UseSecurityHeaders_AddsXContentTypeOptions()
    {
        using var host = await CreateHostWithSecurityHeaders();
        var client = host.GetTestClient();

        var response = await client.GetAsync("/");

        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").First());
    }

    [Fact]
    public async Task UseSecurityHeaders_AddsXFrameOptions()
    {
        using var host = await CreateHostWithSecurityHeaders();
        var client = host.GetTestClient();

        var response = await client.GetAsync("/");

        Assert.True(response.Headers.Contains("X-Frame-Options"));
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").First());
    }

    [Fact]
    public async Task UseSecurityHeaders_AddsReferrerPolicy()
    {
        using var host = await CreateHostWithSecurityHeaders();
        var client = host.GetTestClient();

        var response = await client.GetAsync("/");

        Assert.True(response.Headers.Contains("Referrer-Policy"));
        Assert.Equal(
            "strict-origin-when-cross-origin",
            response.Headers.GetValues("Referrer-Policy").First());
    }

    [Fact]
    public async Task UseSecurityHeaders_AddsPermittedCrossDomainPolicies()
    {
        using var host = await CreateHostWithSecurityHeaders();
        var client = host.GetTestClient();

        var response = await client.GetAsync("/");

        Assert.True(response.Headers.Contains("X-Permitted-Cross-Domain-Policies"));
        Assert.Equal("none", response.Headers.GetValues("X-Permitted-Cross-Domain-Policies").First());
    }

    [Fact]
    public async Task UseSecurityHeaders_AddsPermissionsPolicy()
    {
        using var host = await CreateHostWithSecurityHeaders();
        var client = host.GetTestClient();

        var response = await client.GetAsync("/");

        Assert.True(response.Headers.Contains("Permissions-Policy"));
        var value = response.Headers.GetValues("Permissions-Policy").First();
        Assert.Contains("camera=()", value);
        Assert.Contains("microphone=()", value);
    }

    private static async Task<IHost> CreateHostWithSecurityHeaders()
    {
        return await new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.Configure(app =>
                {
                    app.UseSecurityHeaders();
                    app.Run(async context =>
                    {
                        await context.Response.WriteAsync("OK");
                    });
                });
            })
            .StartAsync();
    }
}
