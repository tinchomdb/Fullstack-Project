using System.Text.Json.Serialization;
using Newtonsoft.Json.Converters;

namespace Api.Models;

public sealed record class Order
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = Guid.NewGuid().ToString();

    [JsonPropertyName("userId")]
    public string UserId { get; init; } = string.Empty;

    public string? OriginalCartId { get; init; }

    public DateTime OrderDate { get; init; } = DateTime.UtcNow;

    [Newtonsoft.Json.JsonConverter(typeof(StringEnumConverter))]
    public OrderStatus Status { get; init; }

    public IReadOnlyList<OrderItem> Items { get; init; } = [];

    public decimal Subtotal { get; init; }

    public decimal ShippingCost { get; init; }

    public decimal Total { get; init; }

    public string Currency { get; init; } = "USD";

    [JsonPropertyName("type")]
    public string Type { get; init; } = "Order";
}
