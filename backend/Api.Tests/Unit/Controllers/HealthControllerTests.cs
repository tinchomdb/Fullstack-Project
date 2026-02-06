using Api.Controllers;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Api.Tests.Unit.Controllers;

public class HealthControllerTests
{
    private readonly Mock<IWebHostEnvironment> _mockEnvironment;
    private readonly HealthController _controller;

    public HealthControllerTests()
    {
        _mockEnvironment = new Mock<IWebHostEnvironment>();
        _mockEnvironment.Setup(e => e.EnvironmentName).Returns("Test");
        _controller = new HealthController(_mockEnvironment.Object);
    }

    [Fact]
    public void Get_ReturnsOkResult()
    {
        var result = _controller.Get();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void Get_ReturnsStatusAndEnvironment()
    {
        var result = _controller.Get() as OkObjectResult;
        var value = result?.Value;

        Assert.NotNull(value);

        var statusProperty = value.GetType().GetProperty("Status");
        Assert.NotNull(statusProperty);
        Assert.Equal("Healthy", statusProperty.GetValue(value));

        var environmentProperty = value.GetType().GetProperty("Environment");
        Assert.NotNull(environmentProperty);
        Assert.Equal("Test", environmentProperty.GetValue(value));
    }
}
