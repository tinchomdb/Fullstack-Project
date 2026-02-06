namespace Application.DTOs;

public sealed record CartItemResponse
{
    public string ProductId { get; init; } = string.Empty;
    public string ProductName { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string ImageUrl { get; init; } = string.Empty;
    public string SellerId { get; init; } = string.Empty;
    public string SellerName { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public decimal UnitPrice { get; init; }
    public decimal LineTotal { get; init; }
    public DateTime AddedDate { get; init; }
}
