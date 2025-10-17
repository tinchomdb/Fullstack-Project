using Stripe;
using Api.Configuration;
using Api.Services;

namespace Api.Extensions
{
    public static class StripeExtensions
    {
        public static IServiceCollection AddStripePayment(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Bind Stripe configuration
            var stripeSettings = new StripeSettings();
            configuration.GetSection(StripeSettings.SectionName).Bind(stripeSettings);

            // Validate that the secret key is configured
            if (string.IsNullOrEmpty(stripeSettings.SecretKey))
            {
                throw new InvalidOperationException(
                    $"Stripe secret key is not configured. " +
                    $"Please set '{StripeSettings.SectionName}:{nameof(StripeSettings.SecretKey)}' " +
                    $"in User Secrets (development) or Azure Key Vault (production).");
            }

            // Configure Stripe API key
            StripeConfiguration.ApiKey = stripeSettings.SecretKey;

            // Register payment service
            services.AddScoped<IPaymentService, PaymentService>();

            return services;
        }
    }
}
