namespace Application.DTOs;

public sealed class CreatePaymentIntentResponse
{
    public string ClientSecret { get; set; } = string.Empty;
    public long Amount { get; set; }
    public string PaymentIntentId { get; set; } = string.Empty;
}
