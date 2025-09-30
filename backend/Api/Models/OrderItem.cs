namespace Api.Models;

public sealed record class OrderItem
{
    public Guid ProductId { get; init; }

    public string ProductName { get; init; } = string.Empty;

    public string ImageUrl { get; init; } = string.Empty;

    public int Quantity { get; init; }

    public decimal UnitPrice { get; init; }

    public decimal LineTotal { get; init; }
}
