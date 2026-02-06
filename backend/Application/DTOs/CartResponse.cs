using Domain.Entities;

namespace Application.DTOs;

public sealed record CartResponse
{
    public string Id { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public CartStatus Status { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime LastUpdatedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public IReadOnlyList<CartItemResponse> Items { get; init; } = [];
    public decimal Subtotal { get; init; }
    public string Currency { get; init; } = "USD";
    public decimal Total { get; init; }
    public int ItemCount { get; init; }
}
