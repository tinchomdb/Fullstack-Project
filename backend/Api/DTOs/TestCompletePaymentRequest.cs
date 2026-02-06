namespace Api.DTOs;

public sealed record TestCompletePaymentRequest
{
    public string PaymentIntentId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
}
