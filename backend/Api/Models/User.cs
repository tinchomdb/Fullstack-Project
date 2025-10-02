using System.Text.Json.Serialization;

namespace Api.Models;

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

public sealed record class SellerProfile
{
    public string StoreName { get; init; } = string.Empty;

    public string? StoreDescription { get; init; }

    public string? LogoUrl { get; init; }

    // Aggregated statistics (updated via Change Feed)
    public decimal AverageRating { get; init; }

    public int TotalProducts { get; init; }

    public int TotalOrders { get; init; }

    public int TotalReviews { get; init; }

    public DateTime? LastProductAddedAt { get; init; }

    public bool IsVerified { get; init; }
}

public sealed record class ShippingAddress
{
    public string Id { get; init; } = Guid.NewGuid().ToString();

    public string FullName { get; init; } = string.Empty;

    public string AddressLine1 { get; init; } = string.Empty;

    public string? AddressLine2 { get; init; }

    public string City { get; init; } = string.Empty;

    public string StateOrProvince { get; init; } = string.Empty;

    public string PostalCode { get; init; } = string.Empty;

    public string Country { get; init; } = string.Empty;

    public string? PhoneNumber { get; init; }

    public bool IsDefault { get; init; }
}
