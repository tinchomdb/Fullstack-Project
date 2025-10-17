using Stripe;
using Api.Models.DTOs;

namespace Api.Services
{
    public class PaymentService : IPaymentService
    {
        public async Task<CreatePaymentIntentResponse> CreatePaymentIntentAsync(
            CreatePaymentIntentRequest request)
        {
            var service = new PaymentIntentService();
            var options = new PaymentIntentCreateOptions
            {
                Amount = request.Amount,
                Currency = "usd",
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                },
                Metadata = new Dictionary<string, string>
                {
                    { "email", request.Email },
                    { "created_at", DateTime.UtcNow.ToString("O") }
                }
            };

            var paymentIntent = await service.CreateAsync(options);

            return new CreatePaymentIntentResponse
            {
                ClientSecret = paymentIntent.ClientSecret,
                Amount = paymentIntent.Amount
            };
        }
    }
}
