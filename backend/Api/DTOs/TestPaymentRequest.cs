namespace Api.DTOs;

public sealed record TestPaymentRequest
{
    public long Amount { get; init; }
    public string Email { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
}
