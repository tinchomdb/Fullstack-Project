using System.ComponentModel.DataAnnotations;

namespace Api.Models.DTOs
{
    public class CreatePaymentIntentRequest
    {
        [Required]
        [Range(1, long.MaxValue)]
        public long Amount { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? CartId { get; set; }
        
        public string? UserId { get; set; }
    }

    public class CreatePaymentIntentResponse
    {
        public string ClientSecret { get; set; } = string.Empty;
        public long Amount { get; set; }
        public string PaymentIntentId { get; set; } = string.Empty;
    }
}
