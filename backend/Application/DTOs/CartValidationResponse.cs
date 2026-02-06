namespace Application.DTOs;

public sealed record CartValidationResponse
{
    public bool IsValid { get; init; }
    public string CartId { get; init; } = string.Empty;
    public decimal Subtotal { get; init; }
    public decimal ShippingCost { get; init; }
    public decimal Total { get; init; }
    public List<string> Warnings { get; init; } = [];
}
