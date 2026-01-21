using System.Text.Json.Serialization;

namespace Domain.Entities;

public sealed record class CarouselSlide
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = Guid.NewGuid().ToString();

    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; init; } = string.Empty;

    [JsonPropertyName("alt")]
    public string Alt { get; init; } = string.Empty;

    [JsonPropertyName("order")]
    public int Order { get; init; }

    [JsonPropertyName("isActive")]
    public bool IsActive { get; init; } = true;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;

    // Cosmos DB partition key
    [JsonPropertyName("partitionKey")]
    public string PartitionKey { get; init; } = "carousel-slides";

    // Cosmos DB discriminator for container shared models
    [JsonPropertyName("type")]
    public string Type { get; init; } = "CarouselSlide";
}