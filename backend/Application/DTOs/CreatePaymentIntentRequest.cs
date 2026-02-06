using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public sealed class CreatePaymentIntentRequest
{
    [Required]
    [Range(1, long.MaxValue)]
    public long Amount { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public string? CartId { get; set; }
}
