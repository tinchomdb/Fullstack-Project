using Api.Tests.Helpers;
using Application.DTOs;
using Application.Repositories;
using Application.Services;
using Domain.Entities;
using Infrastructure.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace Api.Tests.Unit.Services;

public class PaymentServiceTests
{
    private readonly Mock<ICartService> _mockCartService;
    private readonly Mock<IOrdersRepository> _mockOrdersRepo;
    private readonly Mock<IUsersRepository> _mockUsersRepo;
    private readonly Mock<IEmailService> _mockEmailService;
    private readonly Mock<ILogger<PaymentService>> _mockLogger;
    private readonly PaymentService _service;

    public PaymentServiceTests()
    {
        _mockCartService = new Mock<ICartService>();
        _mockOrdersRepo = new Mock<IOrdersRepository>();
        _mockUsersRepo = new Mock<IUsersRepository>();
        _mockEmailService = new Mock<IEmailService>();
        _mockLogger = new Mock<ILogger<PaymentService>>();

        _service = new PaymentService(
            _mockCartService.Object,
            _mockOrdersRepo.Object,
            _mockUsersRepo.Object,
            _mockEmailService.Object,
            _mockLogger.Object);
    }

    // ===== ValidateCartTotalAsync =====

    [Fact]
    public async Task ValidateCartTotalAsync_WithMatchingTotal_ReturnsSuccess()
    {
        // Arrange — Total $59.98 + standard shipping $5.99 = $65.97 = 6597 cents
        var cartResponse = new CartResponse
        {
            Total = 59.98m,
            Items = [new CartItemResponse { ProductId = "p1", Quantity = 1 }]
        };
        _mockCartService
            .Setup(s => s.GetActiveCartAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cartResponse);

        // Act
        var result = await _service.ValidateCartTotalAsync("user-1", 6597, 5.99m);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public async Task ValidateCartTotalAsync_WithShipping_IncludesShippingInTotal()
    {
        // Arrange — Total $29.99 + standard shipping $5.99 = $35.98 = 3598 cents
        var cartResponse = new CartResponse
        {
            Total = 29.99m,
            Items = [new CartItemResponse { ProductId = "p1", Quantity = 1 }]
        };
        _mockCartService
            .Setup(s => s.GetActiveCartAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cartResponse);

        // Act
        var result = await _service.ValidateCartTotalAsync("user-1", 3598, 5.99m);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task ValidateCartTotalAsync_WithMismatchedTotal_ReturnsFailure()
    {
        // Arrange
        var cartResponse = new CartResponse
        {
            Total = 59.98m,
            Items = [new CartItemResponse { ProductId = "p1", Quantity = 1 }]
        };
        _mockCartService
            .Setup(s => s.GetActiveCartAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cartResponse);

        // Act — send wrong amount
        var result = await _service.ValidateCartTotalAsync("user-1", 9999, 5.99m);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("mismatch", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ValidateCartTotalAsync_WhenCartEmpty_ReturnsFailure()
    {
        // Arrange
        var cartResponse = new CartResponse
        {
            Total = 0,
            Items = []
        };
        _mockCartService
            .Setup(s => s.GetActiveCartAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cartResponse);

        // Act
        var result = await _service.ValidateCartTotalAsync("user-1", 5998, 5.99m);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("empty", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ValidateCartTotalAsync_WhenNoActiveCart_ReturnsFailure()
    {
        // Arrange
        _mockCartService
            .Setup(s => s.GetActiveCartAsync("user-1", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("No active cart"));

        // Act
        var result = await _service.ValidateCartTotalAsync("user-1", 5998, 5.99m);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("No active cart", result.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    // ===== ProcessPaymentSuccessAsync =====

    [Fact]
    public async Task ProcessPaymentSuccessAsync_WithValidPayment_CreatesOrder()
    {
        // Arrange
        var order = TestDataBuilder.CreateOrder(id: "order-1", userId: "user-1");
        var user = new User { Id = "user-1", Name = "Test User" };

        _mockOrdersRepo
            .Setup(r => r.GetOrderByPaymentIntentIdAsync("pi_123", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);
        _mockCartService
            .Setup(s => s.CheckoutCartAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        _mockOrdersRepo
            .Setup(r => r.UpdateOrderAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order o, CancellationToken _) => o);
        _mockUsersRepo
            .Setup(r => r.GetUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act
        var result = await _service.ProcessPaymentSuccessAsync("pi_123", "user-1", "test@example.com");

        // Assert
        Assert.Equal("pi_123", result.PaymentIntentId);
        Assert.Equal(OrderStatus.Processing, result.Status);
        _mockOrdersRepo.Verify(r => r.UpdateOrderAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Once);
        _mockEmailService.Verify(e => e.SendOrderConfirmationEmailAsync(It.IsAny<OrderConfirmationEmailData>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPaymentSuccessAsync_WithExistingOrder_ReturnsExistingOrderWithoutDuplicate()
    {
        // Arrange
        var existingOrder = TestDataBuilder.CreateOrder(id: "order-1", userId: "user-1") with
        {
            PaymentIntentId = "pi_123",
            Status = OrderStatus.Processing
        };
        _mockOrdersRepo
            .Setup(r => r.GetOrderByPaymentIntentIdAsync("pi_123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingOrder);

        // Act
        var result = await _service.ProcessPaymentSuccessAsync("pi_123", "user-1", "test@example.com");

        // Assert — idempotent: returns existing, no checkout called
        Assert.Equal("order-1", result.Id);
        _mockCartService.Verify(s => s.CheckoutCartAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        _mockOrdersRepo.Verify(r => r.UpdateOrderAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPaymentSuccessAsync_WithMissingPaymentIntentId_ThrowsInvalidOperationException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.ProcessPaymentSuccessAsync("", "user-1", "test@example.com"));
    }

    [Fact]
    public async Task ProcessPaymentSuccessAsync_WithMissingUserId_ThrowsInvalidOperationException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.ProcessPaymentSuccessAsync("pi_123", "", "test@example.com"));
    }

    [Fact]
    public async Task ProcessPaymentSuccessAsync_WhenEmailFails_StillReturnsOrder()
    {
        // Arrange
        var order = TestDataBuilder.CreateOrder(id: "order-1", userId: "user-1");

        _mockOrdersRepo
            .Setup(r => r.GetOrderByPaymentIntentIdAsync("pi_123", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);
        _mockCartService
            .Setup(s => s.CheckoutCartAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);
        _mockOrdersRepo
            .Setup(r => r.UpdateOrderAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order o, CancellationToken _) => o);
        _mockUsersRepo
            .Setup(r => r.GetUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);
        _mockEmailService
            .Setup(e => e.SendOrderConfirmationEmailAsync(It.IsAny<OrderConfirmationEmailData>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("SMTP failure"));

        // Act — should NOT throw despite email failure
        var result = await _service.ProcessPaymentSuccessAsync("pi_123", "user-1", "test@example.com");

        // Assert
        Assert.Equal(OrderStatus.Processing, result.Status);
    }
}
