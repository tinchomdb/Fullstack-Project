using System.Text.Json.Serialization;

namespace Api.Models;

public sealed record class Product
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = Guid.NewGuid().ToString();

    public string Name { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    [JsonPropertyName("slug")]
    public string Slug { get; init; } = string.Empty;

    public decimal Price { get; init; }

    public string Currency { get; init; } = "USD";

    public int Stock { get; init; }

    [JsonPropertyName("sellerId")]
    public string SellerId { get; init; } = string.Empty;

    public IReadOnlyList<string> CategoryIds { get; init; } = [];

    public Seller Seller { get; init; } = new();

    public IReadOnlyList<string> ImageUrls { get; init; } = [];

    public bool Featured { get; init; }

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;

    // Cosmos DB discriminator for container shared models (optional)
    [JsonPropertyName("type")]
    public string Type { get; init; } = "Product";
}
