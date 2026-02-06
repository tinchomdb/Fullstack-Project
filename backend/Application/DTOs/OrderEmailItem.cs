namespace Application.DTOs;

public sealed record OrderEmailItem
{
    public string ProductName { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public decimal Price { get; init; }
    public decimal LineTotal { get; init; }
}
