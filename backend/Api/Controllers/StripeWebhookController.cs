using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Stripe;
using Application.Services;
using Infrastructure.Configuration;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
[DisableCors]
public sealed class StripeWebhookController(
    IPaymentService paymentService,
    IOptions<StripeSettings> stripeSettings,
    ILogger<StripeWebhookController> logger) : ControllerBase
{
    private readonly IPaymentService _paymentService = paymentService;
    private readonly ILogger<StripeWebhookController> _logger = logger;
    private readonly string _webhookSecret = stripeSettings.Value.WebhookSecret;

    [HttpPost]
    public async Task<IActionResult> HandleWebhook(CancellationToken cancellationToken)
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync(cancellationToken);

        try
        {
            var stripeSignature = Request.Headers["Stripe-Signature"].ToString();
            if (string.IsNullOrWhiteSpace(stripeSignature))
            {
                _logger.LogWarning("Webhook request missing Stripe-Signature header");
                return BadRequest("Missing Stripe-Signature header");
            }

            var stripeEvent = EventUtility.ConstructEvent(
                json,
                stripeSignature,
                _webhookSecret,
                throwOnApiVersionMismatch: false
            );

            _logger.LogInformation("Processing Stripe webhook event: {EventType} - {EventId}", 
                stripeEvent.Type, stripeEvent.Id);

            if (stripeEvent.Type == "payment_intent.succeeded")
            {
                var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
                if (paymentIntent != null)
                {
                    await HandlePaymentSuccessAsync(paymentIntent, cancellationToken);
                }
            }

            return Ok();
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook signature verification failed");
            return BadRequest("Invalid signature");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Stripe webhook");
            // Return 200 OK to prevent Stripe from retrying this webhook
            // The error is already logged above
            return Ok();
        }
    }

    private async Task HandlePaymentSuccessAsync(
        PaymentIntent paymentIntent, 
        CancellationToken cancellationToken)
    {
        var userId = paymentIntent.Metadata.GetValueOrDefault("user_id");
        var email = paymentIntent.Metadata.GetValueOrDefault("email");

        if (string.IsNullOrWhiteSpace(userId))
        {
            _logger.LogWarning(
                "Payment intent {PaymentIntentId} missing user_id metadata",
                paymentIntent.Id);
            return;
        }

        try
        {
            await _paymentService.ProcessPaymentSuccessAsync(
                paymentIntent.Id,
                userId,
                email ?? string.Empty,
                cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to process successful payment {PaymentIntentId} for user {UserId}",
                paymentIntent.Id, userId);
            // Note: Don't rethrow here as webhook should return 200 to Stripe
            // The error is already logged by the payment service
        }
    }
}
