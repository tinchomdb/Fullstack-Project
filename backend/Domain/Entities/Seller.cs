namespace Domain.Entities;

public sealed record class Seller
{
    public string Id { get; init; } = string.Empty;

    public string DisplayName { get; init; } = string.Empty;

    public string? CompanyName { get; init; }

    public string Email { get; init; } = string.Empty;

    // Seller statistics (updated via Change Feed or scheduled jobs)
    public decimal AverageRating { get; init; }

    public int TotalProducts { get; init; }

    public int TotalSales { get; init; }
}