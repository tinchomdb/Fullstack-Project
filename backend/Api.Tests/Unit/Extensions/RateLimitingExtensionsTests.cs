using Api.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Api.Tests.Unit.Extensions;

public class RateLimitingExtensionsTests
{
    [Fact]
    public void AddRateLimiting_RegistersRateLimiterServices()
    {
        var services = new ServiceCollection();

        services.AddRateLimiting();

        var provider = services.BuildServiceProvider();
        Assert.Contains(services, s => s.ServiceType.FullName?.Contains("RateLimiter") == true);
    }

    [Fact]
    public void GuestTokenPolicy_HasExpectedValue()
    {
        Assert.Equal("guest-token", RateLimitingExtensions.GuestTokenPolicy);
    }

    [Fact]
    public void PaymentCreatePolicy_HasExpectedValue()
    {
        Assert.Equal("payment-create", RateLimitingExtensions.PaymentCreatePolicy);
    }

    [Fact]
    public void GlobalPolicy_HasExpectedValue()
    {
        Assert.Equal("global-default", RateLimitingExtensions.GlobalPolicy);
    }

    [Fact]
    public async Task RateLimiting_AllowsRequestsWithinLimit()
    {
        using var host = await CreateHostWithRateLimiting();
        var client = host.GetTestClient();

        var response = await client.GetAsync("/rate-limited");

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RateLimiting_RejectsRequestsExceedingLimit()
    {
        using var host = await CreateHostWithRateLimiting();
        var client = host.GetTestClient();

        HttpResponseMessage? lastResponse = null;
        for (var i = 0; i < 11; i++)
        {
            lastResponse = await client.GetAsync("/rate-limited");
        }

        Assert.Equal(System.Net.HttpStatusCode.TooManyRequests, lastResponse!.StatusCode);
    }

    private static async Task<IHost> CreateHostWithRateLimiting()
    {
        return await new HostBuilder()
            .ConfigureWebHost(webBuilder =>
            {
                webBuilder.UseTestServer();
                webBuilder.ConfigureServices(services =>
                {
                    services.AddRouting();
                    services.AddRateLimiting();
                });
                webBuilder.Configure(app =>
                {
                    app.UseRouting();
                    app.UseApiRateLimiting();
                    app.UseEndpoints(endpoints =>
                    {
                        endpoints.MapGet("/rate-limited", async context =>
                        {
                            await context.Response.WriteAsync("OK");
                        }).RequireRateLimiting(RateLimitingExtensions.GuestTokenPolicy);
                    });
                });
            })
            .StartAsync();
    }
}
