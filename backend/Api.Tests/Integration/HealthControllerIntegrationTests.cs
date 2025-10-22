using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using Xunit;

namespace Api.Tests.Integration;

[Trait("Category", "Integration")]
public class HealthControllerIntegrationTests : IAsyncLifetime
{
    private WebApplicationFactory<Program> _factory = null!;
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
        await Task.CompletedTask;
    }

    public async Task DisposeAsync()
    {
        _client?.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsOkStatusCode()
    {
        // Act
        var response = await _client.GetAsync("/api/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsJsonContent()
    {
        // Act
        var response = await _client.GetAsync("/api/health");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.NotEmpty(content);
        // JSON uses camelCase due to JsonSerializerOptions
        Assert.Contains("environment", content);
        Assert.Contains("configurationStatus", content);
    }

    [Fact]
    public async Task HealthEndpoint_ContainsExpectedProperties()
    {
        // Act
        var response = await _client.GetAsync("/api/health");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        // JSON property names are in camelCase
        Assert.Contains("environment", content);
        Assert.Contains("isProduction", content);
        Assert.Contains("isDevelopment", content);
        Assert.Contains("hasCosmosAccount", content);
        Assert.Contains("hasCosmosKey", content);
        Assert.Contains("databaseName", content);
        Assert.Contains("configurationStatus", content);
    }
}
