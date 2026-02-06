using Api.Controllers;
using Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace Api.Tests.Unit.Controllers;

public class GuestAuthControllerTests
{
    private readonly Mock<IJwtTokenService> _mockJwtTokenService;
    private readonly Mock<ILogger<GuestAuthController>> _mockLogger;
    private readonly GuestAuthController _controller;

    public GuestAuthControllerTests()
    {
        _mockJwtTokenService = new Mock<IJwtTokenService>();
        _mockLogger = new Mock<ILogger<GuestAuthController>>();
        _controller = new GuestAuthController(_mockJwtTokenService.Object, _mockLogger.Object);
    }

    [Fact]
    public void Constructor_WithNullJwtService_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new GuestAuthController(null!, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_WithNullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new GuestAuthController(_mockJwtTokenService.Object, null!));
    }

    [Fact]
    public void GetGuestToken_ReturnsOkWithTokenResponse()
    {
        // Arrange
        _mockJwtTokenService
            .Setup(s => s.GenerateGuestToken())
            .Returns("eyJ.test.token");

        // Act
        var result = _controller.GetGuestToken();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<GuestTokenResponse>(okResult.Value);
        Assert.Equal("eyJ.test.token", response.Token);
        Assert.Equal("Bearer", response.TokenType);
    }
}
