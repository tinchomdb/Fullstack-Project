using Api.Tests.Helpers;
using Application.DTOs;
using Application.Repositories;
using Application.Services;
using Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;

namespace Api.Tests.Unit.Services;

public class CartServiceTests
{
    private readonly Mock<ICartsRepository> _mockCartsRepo;
    private readonly Mock<IProductsRepository> _mockProductsRepo;
    private readonly Mock<IOrdersRepository> _mockOrdersRepo;
    private readonly CartValidator _cartValidator;
    private readonly CartMapper _cartMapper;
    private readonly Mock<ILogger<CartService>> _mockLogger;
    private readonly CartService _service;

    public CartServiceTests()
    {
        _mockCartsRepo = new Mock<ICartsRepository>();
        _mockProductsRepo = new Mock<IProductsRepository>();
        _mockOrdersRepo = new Mock<IOrdersRepository>();
        _cartValidator = new CartValidator();
        _cartMapper = new CartMapper();
        _mockLogger = new Mock<ILogger<CartService>>();

        _service = new CartService(
            _mockCartsRepo.Object,
            _mockProductsRepo.Object,
            _mockOrdersRepo.Object,
            _cartValidator,
            _cartMapper,
            _mockLogger.Object);
    }

    // ===== GetActiveCartAsync =====

    [Fact]
    public async Task GetActiveCartAsync_WithExistingCart_ReturnsCartResponse()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart(
            userId: "user-1",
            items: [TestDataBuilder.CreateCartItem(quantity: 2, unitPrice: 25m)],
            subtotal: 50m, total: 50m);
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);

        // Act
        var response = await _service.GetActiveCartAsync("user-1");

        // Assert
        Assert.Equal(cart.Id, response.Id);
        Assert.Equal("user-1", response.UserId);
        Assert.Single(response.Items);
    }

    [Fact]
    public async Task GetActiveCartAsync_WithNoCart_ReturnsEmptyCartWithoutPersisting()
    {
        // Arrange
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        // Act
        var response = await _service.GetActiveCartAsync("user-1");

        // Assert
        Assert.Equal("user-1", response.UserId);
        Assert.Empty(response.Items);
        _mockCartsRepo.Verify(r => r.UpsertCartAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task GetActiveCartAsync_WithExpiredCart_DeletesAndReturnsEmpty()
    {
        // Arrange
        var expiredCart = TestDataBuilder.CreateCart(
            userId: "user-1",
            expiresAt: DateTime.UtcNow.AddDays(-1));
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(expiredCart);

        // Act
        var response = await _service.GetActiveCartAsync("user-1");

        // Assert
        Assert.Equal("user-1", response.UserId);
        Assert.Empty(response.Items);
        _mockCartsRepo.Verify(r => r.DeleteCartAsync("user-1", It.IsAny<CancellationToken>()), Times.Once);
        _mockCartsRepo.Verify(r => r.UpsertCartAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ===== AddItemToCartAsync =====

    [Fact]
    public async Task AddItemToCartAsync_NewItem_AddsToCart()
    {
        // Arrange
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", price: 20m);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: []);
        var request = new AddToCartRequest { ProductId = "p1", SellerId = "s1", Quantity = 2 };

        SetupProductLookup(product);
        SetupCartLookup("user-1", cart);
        SetupCartSave();

        // Act
        var response = await _service.AddItemToCartAsync("user-1", request);

        // Assert
        Assert.Single(response.Items);
        Assert.Equal("p1", response.Items[0].ProductId);
        Assert.Equal(2, response.Items[0].Quantity);
    }

    [Fact]
    public async Task AddItemToCartAsync_ExistingItem_MergesQuantity()
    {
        // Arrange
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", price: 10m, stock: 100);
        var existingItem = TestDataBuilder.CreateCartItem(productId: "p1", quantity: 3, unitPrice: 10m);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [existingItem]);
        var request = new AddToCartRequest { ProductId = "p1", SellerId = "s1", Quantity = 2 };

        SetupProductLookup(product);
        SetupCartLookup("user-1", cart);
        SetupCartSave();

        // Act
        var response = await _service.AddItemToCartAsync("user-1", request);

        // Assert
        Assert.Single(response.Items);
        Assert.Equal(5, response.Items[0].Quantity); // 3 + 2
    }

    [Fact]
    public async Task AddItemToCartAsync_ProductNotFound_ThrowsInvalidOperationException()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart(userId: "user-1");
        var request = new AddToCartRequest { ProductId = "missing", SellerId = "s1", Quantity = 1 };

        _mockProductsRepo
            .Setup(r => r.GetProductAsync("missing", "s1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);
        SetupCartLookup("user-1", cart);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.AddItemToCartAsync("user-1", request));
    }

    [Fact]
    public async Task AddItemToCartAsync_InvalidRequest_ThrowsArgumentException()
    {
        // Arrange — empty ProductId
        var request = new AddToCartRequest { ProductId = "", SellerId = "s1", Quantity = 1 };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.AddItemToCartAsync("user-1", request));
    }

    // ===== UpdateCartItemAsync =====

    [Fact]
    public async Task UpdateCartItemAsync_WithValidQuantity_UpdatesItem()
    {
        // Arrange
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", price: 15m, stock: 50);
        var existingItem = TestDataBuilder.CreateCartItem(productId: "p1", quantity: 2, unitPrice: 15m);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [existingItem]);
        var request = new UpdateCartItemRequest { ProductId = "p1", SellerId = "s1", Quantity = 5 };

        SetupProductLookup(product);
        SetupCartLookupStrict("user-1", cart);
        SetupCartSave();

        // Act
        var response = await _service.UpdateCartItemAsync("user-1", request);

        // Assert
        Assert.Single(response.Items);
        Assert.Equal(5, response.Items[0].Quantity);
    }

    [Fact]
    public async Task UpdateCartItemAsync_WithZeroQuantity_RemovesItem()
    {
        // Arrange
        var existingItem = TestDataBuilder.CreateCartItem(productId: "p1", quantity: 2);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [existingItem]);
        var request = new UpdateCartItemRequest { ProductId = "p1", SellerId = "s1", Quantity = 0 };

        SetupCartLookupStrict("user-1", cart);

        // Act & Assert — RemoveItemFromCartAsync is called, which deletes the cart if last item
        // The cart has only one item, so clearing will delete the cart
        var response = await _service.UpdateCartItemAsync("user-1", request);
        Assert.Empty(response.Items);
    }

    [Fact]
    public async Task UpdateCartItemAsync_ItemNotInCart_ThrowsInvalidOperationException()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: []);
        var request = new UpdateCartItemRequest { ProductId = "missing", SellerId = "s1", Quantity = 3 };

        SetupCartLookupStrict("user-1", cart);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.UpdateCartItemAsync("user-1", request));
    }

    // ===== RemoveItemFromCartAsync =====

    [Fact]
    public async Task RemoveItemFromCartAsync_WithMultipleItems_RemovesSpecificItem()
    {
        // Arrange
        var item1 = TestDataBuilder.CreateCartItem(productId: "p1", quantity: 1, unitPrice: 10m);
        var item2 = TestDataBuilder.CreateCartItem(productId: "p2", quantity: 2, unitPrice: 20m);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [item1, item2]);

        SetupCartLookupStrict("user-1", cart);
        SetupCartSave();

        // Act
        var response = await _service.RemoveItemFromCartAsync("user-1", "p1");

        // Assert
        Assert.Single(response.Items);
        Assert.Equal("p2", response.Items[0].ProductId);
    }

    [Fact]
    public async Task RemoveItemFromCartAsync_LastItem_DeletesCart()
    {
        // Arrange
        var item = TestDataBuilder.CreateCartItem(productId: "p1");
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [item]);

        SetupCartLookupStrict("user-1", cart);

        // Act
        var response = await _service.RemoveItemFromCartAsync("user-1", "p1");

        // Assert
        Assert.Empty(response.Items);
        _mockCartsRepo.Verify(r => r.DeleteCartAsync("user-1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveItemFromCartAsync_ItemNotInCart_ThrowsInvalidOperationException()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: []);
        SetupCartLookupStrict("user-1", cart);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.RemoveItemFromCartAsync("user-1", "nonexistent"));
    }

    // ===== ClearCartAsync =====

    [Fact]
    public async Task ClearCartAsync_DeletesCartAndReturnsEmpty()
    {
        // Act
        var response = await _service.ClearCartAsync("user-1");

        // Assert
        Assert.Equal("user-1", response.UserId);
        Assert.Empty(response.Items);
        Assert.Equal(0m, response.Total);
        _mockCartsRepo.Verify(r => r.DeleteCartAsync("user-1", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ===== ValidateCartForCheckoutAsync =====

    [Fact]
    public async Task ValidateCartForCheckoutAsync_WithValidCart_ReturnsValid()
    {
        // Arrange
        var item = TestDataBuilder.CreateCartItem(productId: "p1", sellerId: "s1", quantity: 1, unitPrice: 60m);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [item]);
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", price: 60m, stock: 10);

        SetupCartLookupStrict("user-1", cart);
        SetupProductLookup(product);

        // Act
        var response = await _service.ValidateCartForCheckoutAsync("user-1");

        // Assert
        Assert.True(response.IsValid);
        Assert.Equal(cart.Id, response.CartId);
        Assert.Equal(60m, response.Subtotal);
        Assert.Equal(0m, response.ShippingCost); // > 50 = free shipping
        Assert.Equal(60m, response.Total);
    }

    [Fact]
    public async Task ValidateCartForCheckoutAsync_WithSubtotalUnder50_IncludesShipping()
    {
        // Arrange
        var item = TestDataBuilder.CreateCartItem(productId: "p1", sellerId: "s1", quantity: 1, unitPrice: 30m);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [item]);
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", price: 30m, stock: 10);

        SetupCartLookupStrict("user-1", cart);
        SetupProductLookup(product);

        // Act
        var response = await _service.ValidateCartForCheckoutAsync("user-1");

        // Assert
        Assert.True(response.IsValid);
        Assert.Equal(30m, response.Subtotal);
        Assert.Equal(5.99m, response.ShippingCost);
        Assert.Equal(35.99m, response.Total);
    }

    [Fact]
    public async Task ValidateCartForCheckoutAsync_WithEmptyCart_ReturnsInvalid()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: []);
        SetupCartLookupStrict("user-1", cart);

        // Act
        var response = await _service.ValidateCartForCheckoutAsync("user-1");

        // Assert
        Assert.False(response.IsValid);
        Assert.NotEmpty(response.Warnings);
    }

    [Fact]
    public async Task ValidateCartForCheckoutAsync_WithNoCart_ThrowsInvalidOperationException()
    {
        // Arrange
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.ValidateCartForCheckoutAsync("user-1"));
    }

    [Fact]
    public async Task ValidateCartForCheckoutAsync_WithUnavailableProduct_SkipsItGracefully()
    {
        // Arrange — cart has 2 items, but one product is unavailable
        var items = new List<CartItem>
        {
            TestDataBuilder.CreateCartItem(productId: "p1", sellerId: "s1", quantity: 1, unitPrice: 100m),
            TestDataBuilder.CreateCartItem(productId: "p2", sellerId: "s2", quantity: 1, unitPrice: 50m)
        };
        var cart = TestDataBuilder.CreateCart(items: items, subtotal: 150m, total: 150m);
        var availableProduct = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", price: 100m, stock: 10);

        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);
        _mockProductsRepo
            .Setup(r => r.GetProductAsync("p1", "s1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(availableProduct);
        _mockProductsRepo
            .Setup(r => r.GetProductAsync("p2", "s2", It.IsAny<CancellationToken>()))
            .ThrowsAsync(new Exception("Product not found"));

        // Act — should NOT throw; unavailable product is skipped
        var response = await _service.ValidateCartForCheckoutAsync("user-1");

        // Assert — only p1 is validated, p2 skipped
        Assert.True(response.IsValid);
    }

    // ===== CheckoutCartAsync =====

    [Fact]
    public async Task CheckoutCartAsync_CreatesOrderAndCompletesCart()
    {
        // Arrange
        var item = TestDataBuilder.CreateCartItem(productId: "p1", sellerId: "s1", quantity: 1, unitPrice: 100m);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [item]);
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", price: 100m, stock: 10);

        SetupCartLookupStrict("user-1", cart);
        SetupProductLookup(product);
        _mockCartsRepo
            .Setup(r => r.UpsertCartAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart c, CancellationToken _) => c);
        _mockOrdersRepo
            .Setup(r => r.CreateOrderAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order o, CancellationToken _) => o);

        // Act
        var order = await _service.CheckoutCartAsync("user-1");

        // Assert
        Assert.Equal("user-1", order.UserId);
        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Equal(100m, order.Subtotal);
        Assert.Equal(0m, order.ShippingCost); // > 50 = free
        Assert.Single(order.Items);
        _mockCartsRepo.Verify(r => r.UpsertCartAsync(
            It.Is<Cart>(c => c.Status == CartStatus.Completed), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CheckoutCartAsync_WithEmptyCart_ThrowsInvalidOperationException()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: []);
        SetupCartLookupStrict("user-1", cart);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CheckoutCartAsync("user-1"));
    }

    [Fact]
    public async Task CheckoutCartAsync_RecalculatesItemPricesFromCurrentProduct()
    {
        // Arrange — cart item has stale price (20m), product now costs 30m
        var item = TestDataBuilder.CreateCartItem(productId: "p1", sellerId: "s1", quantity: 2, unitPrice: 20m);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [item]);
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", price: 30m, stock: 10);

        SetupCartLookupStrict("user-1", cart);
        SetupProductLookup(product);
        SetupCartSave();
        _mockOrdersRepo
            .Setup(r => r.CreateOrderAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order o, CancellationToken _) => o);

        // Act
        var order = await _service.CheckoutCartAsync("user-1");

        // Assert — order should reflect recalculated price (30m * 2 = 60m)
        Assert.Equal(60m, order.Subtotal);
        Assert.Single(order.Items);
        Assert.Equal(30m, order.Items[0].UnitPrice);
        Assert.Equal(60m, order.Items[0].LineTotal);
    }

    [Fact]
    public async Task CheckoutCartAsync_SavesCompletedCartBeforeCreatingOrder()
    {
        // Arrange
        var item = TestDataBuilder.CreateCartItem(productId: "p1", sellerId: "s1", quantity: 1, unitPrice: 50m);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [item]);
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", price: 50m, stock: 10);

        SetupCartLookupStrict("user-1", cart);
        SetupProductLookup(product);
        SetupCartSave();

        var callOrder = new List<string>();
        _mockCartsRepo
            .Setup(r => r.UpsertCartAsync(It.Is<Cart>(c => c.Status == CartStatus.Completed), It.IsAny<CancellationToken>()))
            .Callback<Cart, CancellationToken>((c, _) => callOrder.Add("UpsertCart"))
            .ReturnsAsync((Cart c, CancellationToken _) => c);
        _mockOrdersRepo
            .Setup(r => r.CreateOrderAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .Callback<Order, CancellationToken>((o, _) => callOrder.Add("CreateOrder"))
            .ReturnsAsync((Order o, CancellationToken _) => o);

        // Act
        await _service.CheckoutCartAsync("user-1");

        // Assert — cart must be saved as Completed before order creation
        Assert.Equal(2, callOrder.Count);
        Assert.Equal("UpsertCart", callOrder[0]);
        Assert.Equal("CreateOrder", callOrder[1]);
    }

    [Fact]
    public async Task CheckoutCartAsync_WithMultipleItems_ValidatesAllProductsInParallel()
    {
        // Arrange — cart with multiple items from different sellers
        var item1 = TestDataBuilder.CreateCartItem(productId: "p1", sellerId: "s1", quantity: 1, unitPrice: 25m);
        var item2 = TestDataBuilder.CreateCartItem(productId: "p2", sellerId: "s2", quantity: 2, unitPrice: 15m);
        var cart = TestDataBuilder.CreateCart(userId: "user-1", items: [item1, item2]);

        var product1 = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", price: 25m, stock: 10);
        var product2 = TestDataBuilder.CreateProduct(id: "p2", sellerId: "s2", price: 15m, stock: 20);

        SetupCartLookupStrict("user-1", cart);
        SetupProductLookup(product1);
        SetupProductLookup(product2);
        SetupCartSave();
        _mockOrdersRepo
            .Setup(r => r.CreateOrderAsync(It.IsAny<Order>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Order o, CancellationToken _) => o);

        // Act
        var order = await _service.CheckoutCartAsync("user-1");

        // Assert — both products validated and included
        Assert.Equal(2, order.Items.Count);
        Assert.Equal(55m, order.Subtotal); // 25 + 30
        _mockProductsRepo.Verify(
            r => r.GetProductAsync("p1", "s1", It.IsAny<CancellationToken>()), Times.Once);
        _mockProductsRepo.Verify(
            r => r.GetProductAsync("p2", "s2", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ===== MigrateGuestCartAsync =====

    [Fact]
    public async Task MigrateGuestCartAsync_WithGuestCart_MigratesItemsToUser()
    {
        // Arrange
        var guestItem = TestDataBuilder.CreateCartItem(productId: "p1", quantity: 2, unitPrice: 10m);
        var guestCart = TestDataBuilder.CreateCart(userId: "guest-1", items: [guestItem]);

        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("guest-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(guestCart);
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);
        _mockCartsRepo
            .Setup(r => r.UpsertCartAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart c, CancellationToken _) => c);

        // Act
        await _service.MigrateGuestCartAsync("guest-1", "user-1");

        // Assert
        _mockCartsRepo.Verify(r => r.UpsertCartAsync(
            It.Is<Cart>(c => c.UserId == "user-1" && c.Items.Count == 1),
            It.IsAny<CancellationToken>()), Times.Once);
        _mockCartsRepo.Verify(r => r.DeleteCartAsync("guest-1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MigrateGuestCartAsync_WithExistingUserCart_MergesItems()
    {
        // Arrange
        var guestItem = TestDataBuilder.CreateCartItem(productId: "p2", quantity: 1, unitPrice: 20m);
        var guestCart = TestDataBuilder.CreateCart(userId: "guest-1", items: [guestItem]);

        var userItem = TestDataBuilder.CreateCartItem(productId: "p1", quantity: 3, unitPrice: 10m);
        var userCart = TestDataBuilder.CreateCart(userId: "user-1", items: [userItem]);

        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("guest-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(guestCart);
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(userCart);
        _mockCartsRepo
            .Setup(r => r.UpsertCartAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart c, CancellationToken _) => c);

        // Act
        await _service.MigrateGuestCartAsync("guest-1", "user-1");

        // Assert
        _mockCartsRepo.Verify(r => r.UpsertCartAsync(
            It.Is<Cart>(c => c.UserId == "user-1" && c.Items.Count == 2),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MigrateGuestCartAsync_WithDuplicateItems_SumsQuantities()
    {
        // Arrange — both carts have product "p1"
        var guestItem = TestDataBuilder.CreateCartItem(productId: "p1", quantity: 2, unitPrice: 10m);
        var guestCart = TestDataBuilder.CreateCart(userId: "guest-1", items: [guestItem]);

        var userItem = TestDataBuilder.CreateCartItem(productId: "p1", quantity: 3, unitPrice: 10m);
        var userCart = TestDataBuilder.CreateCart(userId: "user-1", items: [userItem]);

        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("guest-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(guestCart);
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("user-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(userCart);
        _mockCartsRepo
            .Setup(r => r.UpsertCartAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart c, CancellationToken _) => c);

        // Act
        await _service.MigrateGuestCartAsync("guest-1", "user-1");

        // Assert
        _mockCartsRepo.Verify(r => r.UpsertCartAsync(
            It.Is<Cart>(c => c.Items.Count == 1 && c.Items[0].Quantity == 5), // 3 + 2
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task MigrateGuestCartAsync_WithNoGuestCart_DoesNothing()
    {
        // Arrange
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("guest-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart?)null);

        // Act
        await _service.MigrateGuestCartAsync("guest-1", "user-1");

        // Assert
        _mockCartsRepo.Verify(
            r => r.UpsertCartAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task MigrateGuestCartAsync_WithEmptyGuestCart_DoesNothing()
    {
        // Arrange
        var emptyGuestCart = TestDataBuilder.CreateCart(userId: "guest-1", items: []);
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync("guest-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyGuestCart);

        // Act
        await _service.MigrateGuestCartAsync("guest-1", "user-1");

        // Assert
        _mockCartsRepo.Verify(
            r => r.UpsertCartAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ===== Helper methods =====

    private void SetupProductLookup(Product product)
    {
        _mockProductsRepo
            .Setup(r => r.GetProductAsync(product.Id, product.SellerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);
    }

    private void SetupCartLookup(string userId, Cart? cart)
    {
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);
    }

    /// <summary>
    /// Sets up cart lookup for methods that throw on null (GetCartOrThrowAsync).
    /// </summary>
    private void SetupCartLookupStrict(string userId, Cart cart)
    {
        _mockCartsRepo
            .Setup(r => r.GetActiveCartByUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(cart);
    }

    private void SetupCartSave()
    {
        _mockCartsRepo
            .Setup(r => r.UpsertCartAsync(It.IsAny<Cart>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Cart c, CancellationToken _) => c);
    }
}
