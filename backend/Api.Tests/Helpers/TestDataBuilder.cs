using Domain.Entities;

namespace Api.Tests.Helpers;

/// <summary>
/// Provides factory methods for creating test domain entities with sensible defaults.
/// </summary>
public static class TestDataBuilder
{
    public static Product CreateProduct(
        string id = "product-1",
        string name = "Test Product",
        decimal price = 29.99m,
        string sellerId = "seller-1",
        string sellerName = "Test Seller",
        int stock = 100,
        string slug = "test-product",
        bool featured = false,
        IReadOnlyList<string>? imageUrls = null)
    {
        return new Product
        {
            Id = id,
            Name = name,
            Price = price,
            SellerId = sellerId,
            Slug = slug,
            Stock = stock,
            Featured = featured,
            Seller = new Seller { Id = sellerId, DisplayName = sellerName },
            ImageUrls = imageUrls ?? ["https://example.com/image.jpg"]
        };
    }

    public static CartItem CreateCartItem(
        string productId = "product-1",
        string productName = "Test Product",
        string sellerId = "seller-1",
        string sellerName = "Test Seller",
        int quantity = 1,
        decimal unitPrice = 29.99m,
        DateTime? addedDate = null)
    {
        return new CartItem
        {
            ProductId = productId,
            ProductName = productName,
            Slug = $"{productName.ToLower().Replace(' ', '-')}",
            ImageUrl = "https://example.com/image.jpg",
            SellerId = sellerId,
            SellerName = sellerName,
            Quantity = quantity,
            UnitPrice = unitPrice,
            LineTotal = unitPrice * quantity,
            AddedDate = addedDate ?? DateTime.UtcNow
        };
    }

    public static Cart CreateCart(
        string id = "cart-1",
        string userId = "user-1",
        CartStatus status = CartStatus.Active,
        IReadOnlyList<CartItem>? items = null,
        decimal subtotal = 0,
        decimal total = 0,
        DateTime? expiresAt = null)
    {
        var cartItems = items ?? [];
        return new Cart
        {
            Id = id,
            UserId = userId,
            Status = status,
            Items = cartItems,
            Subtotal = subtotal,
            Total = total,
            ExpiresAt = expiresAt ?? DateTime.UtcNow.AddDays(30),
            CreatedAt = DateTime.UtcNow,
            LastUpdatedAt = DateTime.UtcNow
        };
    }

    public static Order CreateOrder(
        string id = "order-1",
        string userId = "user-1",
        OrderStatus status = OrderStatus.Pending,
        IReadOnlyList<OrderItem>? items = null,
        decimal subtotal = 29.99m,
        decimal shippingCost = 5.99m)
    {
        return new Order
        {
            Id = id,
            UserId = userId,
            Status = status,
            Items = items ?? [],
            Subtotal = subtotal,
            ShippingCost = shippingCost,
            Total = subtotal + shippingCost
        };
    }
}
