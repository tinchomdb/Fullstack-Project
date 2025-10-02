using System.Text.Json.Serialization;

namespace Api.Models;

public sealed record class Category
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = Guid.NewGuid().ToString();

    public string Name { get; init; } = string.Empty;

    public string Slug { get; init; } = string.Empty;

    public string? Description { get; init; }
    
    public string? ParentCategoryId { get; init; }

    public IReadOnlyList<string> SubcategoryIds { get; init; } = [];

    [JsonPropertyName("type")]
    public string Type { get; init; } = "Category";
}
