using System.Security.Claims;
using Api.Controllers;
using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Stripe;

namespace Api.Tests.Unit.Controllers;

public class PaymentsControllerTests
{
    private readonly Mock<IPaymentService> _mockPaymentService;
    private readonly Mock<ILogger<PaymentsController>> _mockLogger;
    private readonly PaymentsController _controller;

    public PaymentsControllerTests()
    {
        _mockPaymentService = new Mock<IPaymentService>();
        _mockLogger = new Mock<ILogger<PaymentsController>>();
        _controller = new PaymentsController(_mockPaymentService.Object, _mockLogger.Object);
        SetupAuthenticatedUser("user-1");
    }

    // ===== CreatePaymentIntent =====

    [Fact]
    public async Task CreatePaymentIntent_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new CreatePaymentIntentRequest { Amount = 5000, Email = "test@example.com" };
        var response = new CreatePaymentIntentResponse
        {
            ClientSecret = "pi_secret",
            Amount = 5000,
            PaymentIntentId = "pi_123"
        };
        _mockPaymentService
            .Setup(s => s.CreatePaymentIntentAsync(request, "user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.CreatePaymentIntent(request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<CreatePaymentIntentResponse>(okResult.Value);
        Assert.Equal("pi_secret", returned.ClientSecret);
    }

    [Fact]
    public async Task CreatePaymentIntent_WithNullRequest_ReturnsBadRequest()
    {
        // Act
        var result = await _controller.CreatePaymentIntent(null!, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreatePaymentIntent_WithZeroAmount_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreatePaymentIntentRequest { Amount = 0, Email = "test@example.com" };

        // Act
        var result = await _controller.CreatePaymentIntent(request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreatePaymentIntent_WithNegativeAmount_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreatePaymentIntentRequest { Amount = -100, Email = "test@example.com" };

        // Act
        var result = await _controller.CreatePaymentIntent(request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreatePaymentIntent_WithEmptyEmail_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreatePaymentIntentRequest { Amount = 5000, Email = "" };

        // Act
        var result = await _controller.CreatePaymentIntent(request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreatePaymentIntent_WhenStripeException_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreatePaymentIntentRequest { Amount = 5000, Email = "test@example.com" };
        _mockPaymentService
            .Setup(s => s.CreatePaymentIntentAsync(request, "user-1", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new StripeException("Card declined"));

        // Act
        var result = await _controller.CreatePaymentIntent(request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreatePaymentIntent_WhenGenericException_Returns500()
    {
        // Arrange
        var request = new CreatePaymentIntentRequest { Amount = 5000, Email = "test@example.com" };
        _mockPaymentService
            .Setup(s => s.CreatePaymentIntentAsync(request, "user-1", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Unexpected error"));

        // Act
        var result = await _controller.CreatePaymentIntent(request, CancellationToken.None);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(500, objectResult.StatusCode);
    }

    // ===== Helper =====

    private void SetupAuthenticatedUser(string userId)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
        var identity = new ClaimsIdentity(claims, "Bearer");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }
}
