using System.Security.Claims;
using Api.Controllers;
using Api.Tests.Helpers;
using Application.Services;
using Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Api.Tests.Unit.Controllers;

public class OrdersControllerTests
{
    private readonly Mock<IOrderService> _mockOrderService;
    private readonly OrdersController _controller;

    public OrdersControllerTests()
    {
        _mockOrderService = new Mock<IOrderService>();
        _controller = new OrdersController(_mockOrderService.Object);
        SetupAuthenticatedUser("user-1");
    }

    [Fact]
    public void Constructor_WithNullService_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new OrdersController(null!));
    }

    // ===== GetMyOrders =====

    [Fact]
    public async Task GetMyOrders_ReturnsOkWithOrders()
    {
        // Arrange
        var orders = new List<Order>
        {
            TestDataBuilder.CreateOrder(id: "o1", userId: "user-1"),
            TestDataBuilder.CreateOrder(id: "o2", userId: "user-1")
        };
        _mockOrderService
            .Setup(s => s.GetOrdersByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(orders);

        // Act
        var result = await _controller.GetMyOrders(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedOrders = Assert.IsAssignableFrom<IReadOnlyList<Order>>(okResult.Value);
        Assert.Equal(2, returnedOrders.Count);
    }

    [Fact]
    public async Task GetMyOrders_WithNoOrders_ReturnsOkWithEmptyList()
    {
        // Arrange
        _mockOrderService
            .Setup(s => s.GetOrdersByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Order>());

        // Act
        var result = await _controller.GetMyOrders(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedOrders = Assert.IsAssignableFrom<IReadOnlyList<Order>>(okResult.Value);
        Assert.Empty(returnedOrders);
    }

    // ===== GetMyOrder =====

    [Fact]
    public async Task GetMyOrder_WithExistingOrder_ReturnsOk()
    {
        // Arrange
        var order = TestDataBuilder.CreateOrder(id: "o1", userId: "user-1");
        _mockOrderService
            .Setup(s => s.GetOrderAsync("o1", "user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(order);

        // Act
        var result = await _controller.GetMyOrder("o1", CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedOrder = Assert.IsType<Order>(okResult.Value);
        Assert.Equal("o1", returnedOrder.Id);
    }

    [Fact]
    public async Task GetMyOrder_WithNonexistentOrder_ReturnsNotFound()
    {
        // Arrange
        _mockOrderService
            .Setup(s => s.GetOrderAsync("missing", "user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order?)null);

        // Act
        var result = await _controller.GetMyOrder("missing", CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
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
