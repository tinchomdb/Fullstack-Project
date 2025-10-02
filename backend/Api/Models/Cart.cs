using System.Text.Json.Serialization;

namespace Api.Models;

public sealed record class Cart
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = string.Empty;

    [JsonPropertyName("userId")]
    public string UserId { get; init; } = string.Empty;

    public DateTime LastUpdatedAt { get; init; } = DateTime.UtcNow;

    public IReadOnlyList<CartItem> Items { get; init; } = [];

    public decimal Subtotal { get; init; }

    public string Currency { get; init; } = "USD";

    public decimal Total { get; init; }

    [JsonPropertyName("type")]
    public string Type { get; init; } = "Cart";
}
