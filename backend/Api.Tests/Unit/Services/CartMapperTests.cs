using Api.Tests.Helpers;
using Application.Services;
using Domain.Entities;

namespace Api.Tests.Unit.Services;

public class CartMapperTests
{
    private readonly CartMapper _mapper = new();

    // --- MapToCartResponse ---

    [Fact]
    public void MapToCartResponse_WithCartItems_MapsAllFieldsCorrectly()
    {
        // Arrange
        var item = TestDataBuilder.CreateCartItem(
            productId: "p1", productName: "Laptop", quantity: 2, unitPrice: 100m);
        var cart = TestDataBuilder.CreateCart(
            id: "cart-1", userId: "user-1",
            items: [item], subtotal: 200m, total: 200m);

        // Act
        var response = _mapper.MapToCartResponse(cart);

        // Assert
        Assert.Equal("cart-1", response.Id);
        Assert.Equal("user-1", response.UserId);
        Assert.Equal(CartStatus.Active, response.Status);
        Assert.Equal(200m, response.Subtotal);
        Assert.Equal(200m, response.Total);
        Assert.Single(response.Items);

        var itemResponse = response.Items[0];
        Assert.Equal("p1", itemResponse.ProductId);
        Assert.Equal("Laptop", itemResponse.ProductName);
        Assert.Equal(2, itemResponse.Quantity);
        Assert.Equal(100m, itemResponse.UnitPrice);
        Assert.Equal(200m, itemResponse.LineTotal);
        Assert.True(itemResponse.IsAvailable);
    }

    [Fact]
    public void MapToCartResponse_WithEmptyCart_ReturnsZeroTotals()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart(items: []);

        // Act
        var response = _mapper.MapToCartResponse(cart);

        // Assert
        Assert.Empty(response.Items);
        Assert.Equal(0, response.ItemCount);
    }

    [Fact]
    public void MapToCartResponse_CalculatesItemCountAsSumOfQuantities()
    {
        // Arrange
        var items = new List<CartItem>
        {
            TestDataBuilder.CreateCartItem(productId: "p1", quantity: 3),
            TestDataBuilder.CreateCartItem(productId: "p2", quantity: 2)
        };
        var cart = TestDataBuilder.CreateCart(items: items);

        // Act
        var response = _mapper.MapToCartResponse(cart);

        // Assert
        Assert.Equal(5, response.ItemCount);
    }

    // --- CreateEmptyCartResponse ---

    [Fact]
    public void CreateEmptyCartResponse_ReturnsCorrectDefaults()
    {
        // Act
        var response = _mapper.CreateEmptyCartResponse("user-42");

        // Assert
        Assert.Equal(string.Empty, response.Id);
        Assert.Equal("user-42", response.UserId);
        Assert.Equal(CartStatus.Active, response.Status);
        Assert.Empty(response.Items);
        Assert.Equal(0m, response.Subtotal);
        Assert.Equal(0m, response.Total);
        Assert.Equal(0, response.ItemCount);
    }

    // --- CreateCartItemFromProduct ---

    [Fact]
    public void CreateCartItemFromProduct_MapsProductFieldsCorrectly()
    {
        // Arrange
        var product = TestDataBuilder.CreateProduct(
            id: "p1", name: "Widget", price: 19.99m,
            sellerId: "s1", sellerName: "Acme",
            slug: "widget", imageUrls: ["https://img.com/w.jpg"]);

        // Act
        var item = _mapper.CreateCartItemFromProduct(product, 3);

        // Assert
        Assert.Equal("p1", item.ProductId);
        Assert.Equal("Widget", item.ProductName);
        Assert.Equal("widget", item.Slug);
        Assert.Equal("https://img.com/w.jpg", item.ImageUrl);
        Assert.Equal("s1", item.SellerId);
        Assert.Equal("Acme", item.SellerName);
        Assert.Equal(3, item.Quantity);
        Assert.Equal(19.99m, item.UnitPrice);
        Assert.Equal(59.97m, item.LineTotal);
    }

    [Fact]
    public void CreateCartItemFromProduct_WithNoImages_UsesEmptyString()
    {
        // Arrange
        var product = TestDataBuilder.CreateProduct(imageUrls: []);

        // Act
        var item = _mapper.CreateCartItemFromProduct(product, 1);

        // Assert
        Assert.Equal(string.Empty, item.ImageUrl);
    }

    [Fact]
    public void CreateCartItemFromProduct_WithCustomAddedDate_UsesProvidedDate()
    {
        // Arrange
        var product = TestDataBuilder.CreateProduct();
        var specificDate = new DateTime(2025, 1, 15, 10, 30, 0, DateTimeKind.Utc);

        // Act
        var item = _mapper.CreateCartItemFromProduct(product, 1, specificDate);

        // Assert
        Assert.Equal(specificDate, item.AddedDate);
    }

    // --- UpdateCartItemFromProduct ---

    [Fact]
    public void UpdateCartItemFromProduct_PreservesSellerAndDate()
    {
        // Arrange
        var product = TestDataBuilder.CreateProduct(id: "p1", price: 50m);
        var originalDate = new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc);

        // Act
        var item = _mapper.UpdateCartItemFromProduct(
            product, 4, originalDate, "original-seller", "Original Store");

        // Assert
        Assert.Equal("original-seller", item.SellerId);
        Assert.Equal("Original Store", item.SellerName);
        Assert.Equal(originalDate, item.AddedDate);
        Assert.Equal(4, item.Quantity);
        Assert.Equal(200m, item.LineTotal);
    }

    // --- CreateOrderFromCart ---

    [Fact]
    public void CreateOrderFromCart_CreatesOrderWithPendingStatus()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart(userId: "user-1");
        var items = new List<CartItem>
        {
            TestDataBuilder.CreateCartItem(productId: "p1", quantity: 2, unitPrice: 25m)
        };

        // Act
        var order = _mapper.CreateOrderFromCart(cart, items, subtotal: 50m, shippingCost: 0m);

        // Assert
        Assert.NotNull(order.Id);
        Assert.NotEqual(string.Empty, order.Id);
        Assert.Equal("user-1", order.UserId);
        Assert.Equal(cart.Id, order.OriginalCartId);
        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Equal(50m, order.Subtotal);
        Assert.Equal(0m, order.ShippingCost);
        Assert.Equal(50m, order.Total);
        Assert.Single(order.Items);
    }

    [Fact]
    public void CreateOrderFromCart_MapsCartItemsToOrderItems()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart();
        var items = new List<CartItem>
        {
            TestDataBuilder.CreateCartItem(productId: "p1", productName: "Laptop", quantity: 1, unitPrice: 999m),
            TestDataBuilder.CreateCartItem(productId: "p2", productName: "Mouse", quantity: 2, unitPrice: 25m)
        };

        // Act
        var order = _mapper.CreateOrderFromCart(cart, items, subtotal: 1049m, shippingCost: 0m);

        // Assert
        Assert.Equal(2, order.Items.Count);
        Assert.Equal("p1", order.Items[0].ProductId);
        Assert.Equal("Laptop", order.Items[0].ProductName);
        Assert.Equal(1, order.Items[0].Quantity);
        Assert.Equal(999m, order.Items[0].UnitPrice);
        Assert.Equal("p2", order.Items[1].ProductId);
        Assert.Equal(2, order.Items[1].Quantity);
    }

    // --- CalculateSubtotal ---

    [Fact]
    public void CalculateSubtotal_SumsLineTotals()
    {
        // Arrange
        var items = new List<CartItem>
        {
            TestDataBuilder.CreateCartItem(quantity: 2, unitPrice: 10m),  // LineTotal = 20
            TestDataBuilder.CreateCartItem(quantity: 1, unitPrice: 30m)   // LineTotal = 30
        };

        // Act
        var subtotal = CartMapper.CalculateSubtotal(items);

        // Assert
        Assert.Equal(50m, subtotal);
    }

    [Fact]
    public void CalculateSubtotal_WithEmptyList_ReturnsZero()
    {
        Assert.Equal(0m, CartMapper.CalculateSubtotal([]));
    }

    // --- RecalculateCartTotals ---

    [Fact]
    public void RecalculateCartTotals_UpdatesSubtotalAndTotal()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart(subtotal: 0, total: 0);
        var items = new List<CartItem>
        {
            TestDataBuilder.CreateCartItem(quantity: 2, unitPrice: 25m)  // LineTotal = 50
        };

        // Act
        var updated = _mapper.RecalculateCartTotals(cart, items);

        // Assert
        Assert.Equal(50m, updated.Subtotal);
        Assert.Equal(50m, updated.Total);
        Assert.Single(updated.Items);
    }

    [Fact]
    public void RecalculateCartTotals_UpdatesLastUpdatedAt()
    {
        // Arrange
        var oldDate = DateTime.UtcNow.AddDays(-1);
        var cart = TestDataBuilder.CreateCart() with { LastUpdatedAt = oldDate };

        // Act
        var updated = _mapper.RecalculateCartTotals(cart, []);

        // Assert
        Assert.True(updated.LastUpdatedAt > oldDate);
    }
}
