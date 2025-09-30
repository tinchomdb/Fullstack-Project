namespace Api.Models;

public sealed record class Order
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public DateTime OrderDate { get; init; }

    public OrderStatus Status { get; init; }

    public IReadOnlyList<OrderItem> Items { get; init; } = [];

    public decimal Subtotal { get; init; }

    public decimal ShippingCost { get; init; }

    public decimal Total { get; init; }

    public string Currency { get; init; } = "USD";
}
