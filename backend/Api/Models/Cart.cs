namespace Api.Models;

public sealed record class Cart
{
    public Guid Id { get; init; }

    public Guid UserId { get; init; }

    public DateTime LastUpdatedAt { get; init; }

    public IReadOnlyList<CartItem> Items { get; init; } = [];

    public decimal Subtotal { get; init; }

    public string Currency { get; init; } = "USD";

    public decimal Total { get; init; }
}
