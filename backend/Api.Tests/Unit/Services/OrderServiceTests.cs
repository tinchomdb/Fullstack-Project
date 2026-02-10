using Api.Tests.Helpers;
using Application.Repositories;
using Application.Services;
using Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;

namespace Api.Tests.Unit.Services;

public class OrderServiceTests
{
    private readonly Mock<IOrdersRepository> _mockRepository;
    private readonly Mock<ILogger<OrderService>> _mockLogger;
    private readonly OrderService _service;

    public OrderServiceTests()
    {
        _mockRepository = new Mock<IOrdersRepository>();
        _mockLogger = new Mock<ILogger<OrderService>>();
        _service = new OrderService(_mockRepository.Object, _mockLogger.Object);
    }

    [Fact]
    public void Constructor_WithNullRepository_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new OrderService(null!, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_WithNullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new OrderService(_mockRepository.Object, null!));
    }

    // ===== GetOrdersByUserAsync =====

    [Fact]
    public async Task GetOrdersByUserAsync_ReturnsOrders()
    {
        // Arrange
        var orders = new List<Order>
        {
            TestDataBuilder.CreateOrder(id: "o1", userId: "user-1"),
            TestDataBuilder.CreateOrder(id: "o2", userId: "user-1")
        };
        _mockRepository
            .Setup(r => r.GetOrdersByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(orders);

        // Act
        var result = await _service.GetOrdersByUserAsync("user-1");

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetOrdersByUserAsync_WithNoOrders_ReturnsEmptyList()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetOrdersByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Order>());

        // Act
        var result = await _service.GetOrdersByUserAsync("user-1");

        // Assert
        Assert.Empty(result);
    }

    // ===== GetOrderAsync =====

    [Fact]
    public async Task GetOrderAsync_WithExistingOrder_ReturnsOrder()
    {
        // Arrange
        var order = TestDataBuilder.CreateOrder(id: "o1", userId: "user-1");
        _mockRepository
            .Setup(r => r.GetOrderAsync("o1", "user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act
        var result = await _service.GetOrderAsync("o1", "user-1");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("o1", result.Id);
    }

    [Fact]
    public async Task GetOrderAsync_WithNonexistentOrder_ReturnsNull()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetOrderAsync("missing", "user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        // Act
        var result = await _service.GetOrderAsync("missing", "user-1");

        // Assert
        Assert.Null(result);
    }

    // ===== CreateOrderAsync =====

    [Fact]
    public async Task CreateOrderAsync_DelegatesToRepositoryAndReturnsOrder()
    {
        // Arrange
        var order = TestDataBuilder.CreateOrder(id: "o1", userId: "user-1");
        _mockRepository
            .Setup(r => r.CreateOrderAsync(order, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act
        var result = await _service.CreateOrderAsync(order);

        // Assert
        Assert.Equal("o1", result.Id);
        _mockRepository.Verify(r => r.CreateOrderAsync(order, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ===== UpdateOrderAsync =====

    [Fact]
    public async Task UpdateOrderAsync_DelegatesToRepositoryAndReturnsOrder()
    {
        // Arrange
        var order = TestDataBuilder.CreateOrder(id: "o1") with { Status = OrderStatus.Processing };
        _mockRepository
            .Setup(r => r.UpdateOrderAsync(order, It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act
        var result = await _service.UpdateOrderAsync(order);

        // Assert
        Assert.Equal(OrderStatus.Processing, result.Status);
        _mockRepository.Verify(r => r.UpdateOrderAsync(order, It.IsAny<CancellationToken>()), Times.Once);
    }

    // ===== GetOrderByPaymentIntentIdAsync =====

    [Fact]
    public async Task GetOrderByPaymentIntentIdAsync_WithExistingOrder_ReturnsOrder()
    {
        // Arrange
        var order = TestDataBuilder.CreateOrder(id: "o1", userId: "user-1");
        _mockRepository
            .Setup(r => r.GetOrderByPaymentIntentIdAsync("pi_123", It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act
        var result = await _service.GetOrderByPaymentIntentIdAsync("pi_123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("o1", result.Id);
    }

    [Fact]
    public async Task GetOrderByPaymentIntentIdAsync_WithNonexistentOrder_ReturnsNull()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetOrderByPaymentIntentIdAsync("pi_missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        // Act
        var result = await _service.GetOrderByPaymentIntentIdAsync("pi_missing");

        // Assert
        Assert.Null(result);
    }
}
