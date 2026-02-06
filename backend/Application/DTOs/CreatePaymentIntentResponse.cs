namespace Application.DTOs;

public sealed record CreatePaymentIntentResponse
{
    public string ClientSecret { get; init; } = string.Empty;
    public long Amount { get; init; }
    public string PaymentIntentId { get; init; } = string.Empty;
}
