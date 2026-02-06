namespace Domain.Entities;

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
