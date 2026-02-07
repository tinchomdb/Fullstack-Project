using System.ComponentModel.DataAnnotations;
using Domain.Entities;

namespace Api.DTOs;

public sealed record UpdateProductRequest
{
    [Required]
    [MaxLength(255)]
    public required string Name { get; init; }

    [Required]
    public required string Description { get; init; }

    [Required]
    [MaxLength(255)]
    public required string Slug { get; init; }

    [Required]
    [Range(0.01, (double)decimal.MaxValue, ErrorMessage = "Price must be greater than zero")]
    public decimal Price { get; init; }

    [MaxLength(10)]
    public string Currency { get; init; } = "USD";

    [Required]
    [Range(0, int.MaxValue)]
    public int Stock { get; init; }

    public IReadOnlyList<string> CategoryIds { get; init; } = [];

    public Seller Seller { get; init; } = new();

    public IReadOnlyList<string> ImageUrls { get; init; } = [];

    public bool Featured { get; init; }

    public Product ToEntity(string productId, string sellerId, DateTime createdAt) => new()
    {
        Id = productId,
        Name = Name,
        Description = Description,
        Slug = Slug,
        Price = Price,
        Currency = Currency,
        Stock = Stock,
        SellerId = sellerId,
        CategoryIds = CategoryIds,
        Seller = Seller,
        ImageUrls = ImageUrls,
        Featured = Featured,
        CreatedAt = createdAt,
        UpdatedAt = DateTime.UtcNow
    };
}
