namespace Api.Models;

public sealed record class Product
{
    public Guid Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public decimal Price { get; init; }

    public string Currency { get; init; } = "USD";

    public Guid CategoryId { get; init; }

    public Seller Seller { get; init; } = new();

    public IReadOnlyList<string> ImageUrls { get; init; } = [];

    public DateTime CreatedAt { get; init; }

    public DateTime UpdatedAt { get; init; }
}
