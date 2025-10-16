using Api.Models;
using Api.Models.DTOs;

namespace Api.Services;

public sealed class CartMapper
{
    public CartResponse MapToCartResponse(Cart cart)
    {
        return new CartResponse
        {
            Id = cart.Id,
            UserId = cart.UserId,
            Status = cart.Status,
            CreatedAt = cart.CreatedAt,
            LastUpdatedAt = cart.LastUpdatedAt,
            ExpiresAt = cart.ExpiresAt,
            Items = cart.Items.Select(item => new CartItemResponse
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                Slug = item.Slug,
                ImageUrl = item.ImageUrl,
                SellerId = item.SellerId,
                SellerName = item.SellerName,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                LineTotal = item.LineTotal,
                AddedDate = item.AddedDate,
                IsAvailable = true, // TODO: Check real-time availability
                AvailableStock = 999 // TODO: Fetch real stock
            }).ToList(),
            Subtotal = cart.Subtotal,
            Currency = cart.Currency,
            Total = cart.Total,
            ItemCount = CalculateTotalItemCount(cart.Items)
        };
    }

    public CartResponse CreateEmptyCartResponse(string userId)
    {
        return new CartResponse
        {
            Id = string.Empty,
            UserId = userId,
            Status = CartStatus.Active,
            CreatedAt = DateTime.UtcNow,
            LastUpdatedAt = DateTime.UtcNow,
            Items = [],
            Subtotal = 0,
            Total = 0,
            ItemCount = 0
        };
    }

    public CartItem CreateCartItemFromProduct(Product product, int quantity, DateTime? addedDate = null)
    {
        return new CartItem
        {
            ProductId = product.Id,
            ProductName = product.Name,
            Slug = product.Slug,
            ImageUrl = GetProductImageUrl(product),
            SellerId = product.SellerId,
            SellerName = product.Seller.DisplayName,
            Quantity = quantity,
            UnitPrice = product.Price,
            LineTotal = product.Price * quantity,
            AddedDate = addedDate ?? DateTime.UtcNow
        };
    }

    public CartItem UpdateCartItemFromProduct(
        Product product, 
        int quantity, 
        DateTime addedDate,
        string sellerId,
        string sellerName)
    {
        return CreateCartItemFromProduct(product, quantity, addedDate) with
        {
            SellerId = sellerId,
            SellerName = sellerName
        };
    }

    public Order CreateOrderFromCart(Cart cart, List<CartItem> validatedItems, decimal subtotal, decimal shippingCost)
    {
        return new Order
        {
            Id = Guid.NewGuid().ToString(),
            UserId = cart.UserId,
            OriginalCartId = cart.Id,
            OrderDate = DateTime.UtcNow,
            Status = OrderStatus.Pending,
            Items = validatedItems.Select(cartItem => new OrderItem
            {
                ProductId = cartItem.ProductId,
                ProductName = cartItem.ProductName,
                Quantity = cartItem.Quantity,
                UnitPrice = cartItem.UnitPrice,
                LineTotal = cartItem.LineTotal
            }).ToList(),
            Subtotal = subtotal,
            ShippingCost = shippingCost,
            Total = subtotal + shippingCost,
            Currency = cart.Currency
        };
    }

    private static string GetProductImageUrl(Product product)
    {
        return product.ImageUrls.FirstOrDefault() ?? string.Empty;
    }

    private static int CalculateTotalItemCount(IEnumerable<CartItem> items)
    {
        return items.Sum(i => i.Quantity);
    }

    public static decimal CalculateSubtotal(IEnumerable<CartItem> items)
    {
        return items.Sum(i => i.LineTotal);
    }

    public Cart RecalculateCartTotals(Cart cart, List<CartItem> items)
    {
        var subtotal = CalculateSubtotal(items);
        
        return cart with
        {
            Items = items,
            Subtotal = subtotal,
            Total = subtotal,
            LastUpdatedAt = DateTime.UtcNow
        };
    }
}
