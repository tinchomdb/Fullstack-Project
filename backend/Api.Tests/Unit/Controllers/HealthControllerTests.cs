using Api.Controllers;
using Infrastructure.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;

namespace Api.Tests.Unit.Controllers;

public class HealthControllerTests
{
    private readonly Mock<IWebHostEnvironment> _mockEnvironment;
    private readonly Mock<IOptions<CosmosDbSettings>> _mockCosmosSettings;
    private readonly HealthController _controller;

    public HealthControllerTests()
    {
        _mockEnvironment = new Mock<IWebHostEnvironment>();
        _mockCosmosSettings = new Mock<IOptions<CosmosDbSettings>>();

        // Setup default test values
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Test");

        var cosmosSettings = new CosmosDbSettings
        {
            Account = "test-account",
            Key = "test-key",
            DatabaseName = "test-db"
        };
        _mockCosmosSettings.Setup(s => s.Value).Returns(cosmosSettings);

        _controller = new HealthController(_mockEnvironment.Object, _mockCosmosSettings.Object);
    }

    [Fact]
    public void Get_ReturnsOkResult()
    {
        // Act
        var result = _controller.Get();

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void Get_ReturnsEnvironmentInformation()
    {
        // Act
        var result = _controller.Get() as OkObjectResult;
        var value = result?.Value;

        // Assert
        Assert.NotNull(value);
        
        // Use reflection to check properties
        var environmentProperty = value.GetType().GetProperty("Environment");
        Assert.NotNull(environmentProperty);
        Assert.Equal("Test", environmentProperty.GetValue(value));
    }

    [Fact]
    public void Get_WhenCosmosConfigured_ReturnsFullyConfiguredStatus()
    {
        // Arrange
        var cosmosSettings = new CosmosDbSettings
        {
            Account = "configured-account",
            Key = "configured-key",
            DatabaseName = "test-db"
        };
        _mockCosmosSettings.Setup(s => s.Value).Returns(cosmosSettings);
        var controller = new HealthController(_mockEnvironment.Object, _mockCosmosSettings.Object);

        // Act
        var result = controller.Get() as OkObjectResult;
        var value = result?.Value;

        // Assert
        Assert.NotNull(value);
        var statusProperty = value.GetType().GetProperty("ConfigurationStatus");
        Assert.NotNull(statusProperty);
        Assert.Equal("Fully Configured", statusProperty.GetValue(value));
    }

    [Fact]
    public void Get_WhenCosmosNotConfigured_ReturnsMissingCredentials()
    {
        // Arrange
        var cosmosSettings = new CosmosDbSettings
        {
            Account = string.Empty,
            Key = string.Empty,
            DatabaseName = "test-db"
        };
        _mockCosmosSettings.Setup(s => s.Value).Returns(cosmosSettings);
        var controller = new HealthController(_mockEnvironment.Object, _mockCosmosSettings.Object);

        // Act
        var result = controller.Get() as OkObjectResult;
        var value = result?.Value;

        // Assert
        Assert.NotNull(value);
        var statusProperty = value.GetType().GetProperty("ConfigurationStatus");
        Assert.NotNull(statusProperty);
        Assert.Equal("Missing Credentials", statusProperty.GetValue(value));
    }
}
