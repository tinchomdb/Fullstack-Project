namespace Domain.Entities;

public sealed record class OrderItem
{
    public string ProductId { get; init; } = string.Empty;

    public string ProductName { get; init; } = string.Empty;

    public string ImageUrl { get; init; } = string.Empty;

    public string SellerId { get; init; } = string.Empty;

    public string SellerName { get; init; } = string.Empty;

    public int Quantity { get; init; }

    // Price at time of purchase (historical snapshot)
    public decimal UnitPrice { get; init; }

    public decimal LineTotal { get; init; }
}