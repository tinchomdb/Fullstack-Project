using System.Text.Json.Serialization;

namespace Domain.Entities;

public sealed record class User
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = Guid.NewGuid().ToString();

    public string Email { get; init; } = string.Empty;

    public string Name { get; init; } = string.Empty;

    public string? PhoneNumber { get; init; }

    // User can be both buyer and seller
    public IReadOnlyList<string> Roles { get; init; } = ["buyer"];

    // Optional seller profile (only if user is a seller)
    public SellerProfile? SellerProfile { get; init; }

    public IReadOnlyList<ShippingAddress> ShippingAddresses { get; init; } = [];

    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    public DateTime LastLoginAt { get; init; } = DateTime.UtcNow;

    [JsonPropertyName("type")]
    public string Type { get; init; } = "User";
}