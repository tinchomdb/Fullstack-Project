namespace Api.Models.DTOs;

// Request DTOs - What frontend sends (minimal data only!)
public sealed record AddToCartRequest
{
    public string ProductId { get; init; } = string.Empty;
    public string SellerId { get; init; } = string.Empty;
    public int Quantity { get; init; } = 1;
}

public sealed record UpdateCartItemRequest
{
    public string ProductId { get; init; } = string.Empty;
    public string SellerId { get; init; } = string.Empty;
    public int Quantity { get; init; }
}

public sealed record RemoveFromCartRequest
{
    public string ProductId { get; init; } = string.Empty;
}

// Response DTOs - What backend returns
public sealed record CartResponse
{
    public string Id { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public CartStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime LastUpdatedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public IReadOnlyList<CartItemResponse> Items { get; init; } = [];
    public decimal Subtotal { get; init; }
    public string Currency { get; init; } = "USD";
    public decimal Total { get; init; }
    public int ItemCount { get; init; }
}

public sealed record CartItemResponse
{
    public string ProductId { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string ImageUrl { get; init; } = string.Empty;
    public string SellerId { get; init; } = string.Empty;
    public string SellerName { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal LineTotal { get; init; }
    public DateTime AddedDate { get; init; }
    public bool IsAvailable { get; init; } = true;
    public int AvailableStock { get; init; }
}
