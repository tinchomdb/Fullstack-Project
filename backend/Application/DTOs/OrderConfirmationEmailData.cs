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
    public IReadOnlyList<OrderEmailItem> Items { get; init; } = [];
}
