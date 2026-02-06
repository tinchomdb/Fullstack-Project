using System.Text.Json.Serialization;

namespace Domain.Entities;

public sealed record class Cart
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = Guid.NewGuid().ToString();

    public string UserId { get; init; } = string.Empty;

    public CartStatus Status { get; init; } = CartStatus.Active;

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    public DateTime LastUpdatedAt { get; init; } = DateTime.UtcNow;

    public DateTime? ExpiresAt { get; init; } = DateTime.UtcNow.AddDays(30);

    public IReadOnlyList<CartItem> Items { get; init; } = [];

    public decimal Subtotal { get; init; }

    public string Currency { get; init; } = "USD";

    public decimal Total { get; init; }

    [JsonPropertyName("type")]
    public string Type { get; init; } = "Cart";
}