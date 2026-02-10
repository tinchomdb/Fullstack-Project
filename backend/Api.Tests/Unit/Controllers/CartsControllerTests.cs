using System.Security.Claims;
using Api.Controllers;
using Api.Tests.Helpers;
using Application.DTOs;
using Application.Exceptions;
using Application.Services;
using Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;

namespace Api.Tests.Unit.Controllers;

public class CartsControllerTests
{
    private readonly Mock<ICartService> _mockCartService;
    private readonly Mock<ILogger<CartsController>> _mockLogger;
    private readonly CartsController _controller;

    public CartsControllerTests()
    {
        _mockCartService = new Mock<ICartService>();
        _mockLogger = new Mock<ILogger<CartsController>>();
        _controller = new CartsController(_mockCartService.Object, _mockLogger.Object);
    }

    [Fact]
    public void Constructor_WithNullCartService_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new CartsController(null!, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_WithNullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new CartsController(_mockCartService.Object, null!));
    }

    // ===== GetMyCart =====

    [Fact]
    public async Task GetMyCart_ReturnsOkWithCartResponse()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var cartResponse = CreateCartResponse("user-1");
        _mockCartService
            .Setup(s => s.GetActiveCartAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cartResponse);

        // Act
        var result = await _controller.GetMyCart(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedCart = Assert.IsType<CartResponse>(okResult.Value);
        Assert.Equal("user-1", returnedCart.UserId);
    }

    // ===== GetGuestCart =====

    [Fact]
    public async Task GetGuestCart_ReturnsOkWithCartResponse()
    {
        // Arrange
        SetupGuestUser("guest-session-1");
        var cartResponse = CreateCartResponse("guest-session-1");
        _mockCartService
            .Setup(s => s.GetActiveCartAsync("guest-session-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cartResponse);

        // Act
        var result = await _controller.GetGuestCart(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedCart = Assert.IsType<CartResponse>(okResult.Value);
        Assert.Equal("guest-session-1", returnedCart.UserId);
    }

    // ===== AddItemToMyCart =====

    [Fact]
    public async Task AddItemToMyCart_WithValidRequest_ReturnsOk()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var request = new AddToCartRequest { ProductId = "p1", SellerId = "s1", Quantity = 1 };
        var cartResponse = CreateCartResponse("user-1");
        _mockCartService
            .Setup(s => s.AddItemToCartAsync("user-1", request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cartResponse);

        // Act
        var result = await _controller.AddItemToMyCart(request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<CartResponse>(okResult.Value);
    }

    [Fact]
    public async Task AddItemToMyCart_WhenArgumentException_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var request = new AddToCartRequest { ProductId = "", Quantity = 1 };
        _mockCartService
            .Setup(s => s.AddItemToCartAsync("user-1", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("ProductId is required"));

        // Act
        var result = await _controller.AddItemToMyCart(request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task AddItemToMyCart_WhenInvalidOperationException_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var request = new AddToCartRequest { ProductId = "missing", SellerId = "s1", Quantity = 1 };
        _mockCartService
            .Setup(s => s.AddItemToCartAsync("user-1", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Product not found"));

        // Act
        var result = await _controller.AddItemToMyCart(request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task AddItemToMyCart_WhenInsufficientStock_ReturnsConflict()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var request = new AddToCartRequest { ProductId = "p1", SellerId = "s1", Quantity = 10 };
        _mockCartService
            .Setup(s => s.AddItemToCartAsync("user-1", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InsufficientStockException(10, 5));

        // Act
        var result = await _controller.AddItemToMyCart(request, CancellationToken.None);

        // Assert
        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    // ===== UpdateMyCartItem =====

    [Fact]
    public async Task UpdateMyCartItem_WithValidRequest_ReturnsOk()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var request = new UpdateCartItemRequest { ProductId = "p1", SellerId = "s1", Quantity = 5 };
        var cartResponse = CreateCartResponse("user-1");
        _mockCartService
            .Setup(s => s.UpdateCartItemAsync("user-1", request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cartResponse);

        // Act
        var result = await _controller.UpdateMyCartItem("p1", request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<CartResponse>(okResult.Value);
    }

    [Fact]
    public async Task UpdateMyCartItem_WithMismatchedProductId_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var request = new UpdateCartItemRequest { ProductId = "p1", Quantity = 5 };

        // Act — route productId "p2" doesn't match request body "p1"
        var result = await _controller.UpdateMyCartItem("p2", request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateMyCartItem_WhenItemNotFound_ReturnsNotFound()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var request = new UpdateCartItemRequest { ProductId = "p1", SellerId = "s1", Quantity = 5 };
        _mockCartService
            .Setup(s => s.UpdateCartItemAsync("user-1", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Product not found in cart"));

        // Act
        var result = await _controller.UpdateMyCartItem("p1", request, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateMyCartItem_WhenInsufficientStock_ReturnsConflict()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var request = new UpdateCartItemRequest { ProductId = "p1", SellerId = "s1", Quantity = 20 };
        _mockCartService
            .Setup(s => s.UpdateCartItemAsync("user-1", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InsufficientStockException(20, 10));

        // Act
        var result = await _controller.UpdateMyCartItem("p1", request, CancellationToken.None);

        // Assert
        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    // ===== RemoveItemFromMyCart =====

    [Fact]
    public async Task RemoveItemFromMyCart_WithValidProduct_ReturnsOk()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var cartResponse = CreateCartResponse("user-1");
        _mockCartService
            .Setup(s => s.RemoveItemFromCartAsync("user-1", "p1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cartResponse);

        // Act
        var result = await _controller.RemoveItemFromMyCart("p1", CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.IsType<CartResponse>(okResult.Value);
    }

    [Fact]
    public async Task RemoveItemFromMyCart_WhenItemNotInCart_ReturnsNotFound()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        _mockCartService
            .Setup(s => s.RemoveItemFromCartAsync("user-1", "missing", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("not found"));

        // Act
        var result = await _controller.RemoveItemFromMyCart("missing", CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    // ===== ClearMyCart =====

    [Fact]
    public async Task ClearMyCart_ReturnsOkWithEmptyCart()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var emptyResponse = new CartResponse { UserId = "user-1", Items = [] };
        _mockCartService
            .Setup(s => s.ClearCartAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyResponse);

        // Act
        var result = await _controller.ClearMyCart(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var cart = Assert.IsType<CartResponse>(okResult.Value);
        Assert.Empty(cart.Items);
    }

    // ===== Guest endpoints =====

    [Fact]
    public async Task AddItemToGuestCart_WithValidRequest_ReturnsOk()
    {
        // Arrange
        SetupGuestUser("guest-1");
        var request = new AddToCartRequest { ProductId = "p1", SellerId = "s1", Quantity = 1 };
        var cartResponse = CreateCartResponse("guest-1");
        _mockCartService
            .Setup(s => s.AddItemToCartAsync("guest-1", request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cartResponse);

        // Act
        var result = await _controller.AddItemToGuestCart(request, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result.Result);
    }

    [Fact]
    public async Task AddItemToGuestCart_WhenArgumentException_ReturnsBadRequest()
    {
        // Arrange
        SetupGuestUser("guest-1");
        var request = new AddToCartRequest { ProductId = "", Quantity = 1 };
        _mockCartService
            .Setup(s => s.AddItemToCartAsync("guest-1", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ArgumentException("Invalid"));

        // Act
        var result = await _controller.AddItemToGuestCart(request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task AddItemToGuestCart_WhenInsufficientStock_ReturnsConflict()
    {
        // Arrange
        SetupGuestUser("guest-1");
        var request = new AddToCartRequest { ProductId = "p1", SellerId = "s1", Quantity = 10 };
        _mockCartService
            .Setup(s => s.AddItemToCartAsync("guest-1", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InsufficientStockException(10, 5));

        // Act
        var result = await _controller.AddItemToGuestCart(request, CancellationToken.None);

        // Assert
        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateGuestCartItem_WithMismatchedProductId_ReturnsBadRequest()
    {
        // Arrange
        SetupGuestUser("guest-1");
        var request = new UpdateCartItemRequest { ProductId = "p1", Quantity = 3 };

        // Act
        var result = await _controller.UpdateGuestCartItem("p2", request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateGuestCartItem_WhenInsufficientStock_ReturnsConflict()
    {
        // Arrange
        SetupGuestUser("guest-1");
        var request = new UpdateCartItemRequest { ProductId = "p1", SellerId = "s1", Quantity = 20 };
        _mockCartService
            .Setup(s => s.UpdateCartItemAsync("guest-1", request, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InsufficientStockException(20, 10));

        // Act
        var result = await _controller.UpdateGuestCartItem("p1", request, CancellationToken.None);

        // Assert
        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task RemoveItemFromGuestCart_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        SetupGuestUser("guest-1");
        _mockCartService
            .Setup(s => s.RemoveItemFromCartAsync("guest-1", "missing", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("not found"));

        // Act
        var result = await _controller.RemoveItemFromGuestCart("missing", CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task ClearGuestCart_ReturnsOk()
    {
        // Arrange
        SetupGuestUser("guest-1");
        var emptyResponse = new CartResponse { UserId = "guest-1", Items = [] };
        _mockCartService
            .Setup(s => s.ClearCartAsync("guest-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyResponse);

        // Act
        var result = await _controller.ClearGuestCart(CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result.Result);
    }

    // ===== ValidateCheckout =====

    [Fact]
    public async Task ValidateCheckout_WithValidCart_ReturnsOk()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var validation = new Application.DTOs.CartValidationResponse
        {
            IsValid = true,
            CartId = "cart-1",
            Subtotal = 100m,
            ShippingCost = 0m,
            Total = 100m
        };
        _mockCartService
            .Setup(s => s.ValidateCartForCheckoutAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(validation);

        // Act
        var result = await _controller.ValidateCheckout(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<Application.DTOs.CartValidationResponse>(okResult.Value);
        Assert.True(returned.IsValid);
    }

    [Fact]
    public async Task ValidateCheckout_WhenInvalidOperation_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        _mockCartService
            .Setup(s => s.ValidateCartForCheckoutAsync("user-1", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("No active cart"));

        // Act
        var result = await _controller.ValidateCheckout(CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ===== MigrateGuestCart =====

    [Fact]
    public async Task MigrateGuestCart_WithValidRequest_ReturnsOk()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var request = new MigrateCartRequest { GuestSessionId = "guest-1" };

        // Act
        var result = await _controller.MigrateGuestCart(request, CancellationToken.None);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        _mockCartService.Verify(
            s => s.MigrateGuestCartAsync("guest-1", "user-1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MigrateGuestCart_WithNullRequest_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");

        // Act
        var result = await _controller.MigrateGuestCart(null, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task MigrateGuestCart_WithEmptyGuestSessionId_ReturnsBadRequest()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");
        var request = new MigrateCartRequest { GuestSessionId = "" };

        // Act
        var result = await _controller.MigrateGuestCart(request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ===== Helper methods =====

    private void SetupAuthenticatedUser(string userId)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private void SetupGuestUser(string guestSessionId)
    {
        var claims = new[]
        {
            new Claim("guest", "true"),
            new Claim("guestSessionId", guestSessionId),
            new Claim(ClaimTypes.NameIdentifier, guestSessionId)
        };
        var identity = new ClaimsIdentity(claims, "test");
        var principal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }

    private static CartResponse CreateCartResponse(string userId)
    {
        return new CartResponse
        {
            Id = "cart-1",
            UserId = userId,
            Status = CartStatus.Active,
            Items = [new CartItemResponse { ProductId = "p1", Quantity = 1, UnitPrice = 10m }],
            Subtotal = 10m,
            Total = 10m,
            ItemCount = 1
        };
    }
}
