using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
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
        Assert.Contains("status", content);
        Assert.Contains("environment", content);
    }

    [Fact]
    public async Task HealthEndpoint_ContainsOnlyExpectedProperties()
    {
        // Act
        var response = await _client.GetAsync("/api/health");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Contains("status", content);
        Assert.Contains("environment", content);
        // Sensitive infrastructure details should not be exposed
        Assert.DoesNotContain("isProduction", content);
        Assert.DoesNotContain("hasCosmosAccount", content);
        Assert.DoesNotContain("hasCosmosKey", content);
        Assert.DoesNotContain("databaseName", content);
        Assert.DoesNotContain("configurationStatus", content);
    }
}
