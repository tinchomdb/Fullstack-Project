namespace Application.DTOs;

public sealed record UpdateCartItemRequest
{
    public string ProductId { get; init; } = string.Empty;
    public string SellerId { get; init; } = string.Empty;
    public int Quantity { get; init; }
}
