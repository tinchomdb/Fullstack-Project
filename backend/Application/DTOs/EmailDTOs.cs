namespace Application.DTOs;

public sealed record OrderConfirmationEmailData
{
    public string RecipientEmail { get; init; } = string.Empty;
    public string RecipientName { get; init; } = string.Empty;
    public string OrderId { get; init; } = string.Empty;
    public DateTime OrderDate { get; init; }
    public decimal Subtotal { get; init; }
    public decimal ShippingCost { get; init; }
    public decimal Total { get; init; }
    public List<OrderEmailItem> Items { get; init; } = [];
}

public sealed record OrderEmailItem
{
    public string ProductName { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public decimal Price { get; init; }
    public decimal LineTotal { get; init; }
}