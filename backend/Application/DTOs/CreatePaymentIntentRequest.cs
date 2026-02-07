using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public sealed record CreatePaymentIntentRequest
{
    [Required]
    [Range(1, long.MaxValue)]
    public long Amount { get; init; }

    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    public string? CartId { get; init; }

    [Required]
    [Range(0, double.MaxValue)]
    public decimal ShippingCost { get; init; }
}
