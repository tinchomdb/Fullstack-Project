using Application.Services;
using Infrastructure.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Stripe;

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
    private readonly IPaymentService _paymentService = paymentService ?? throw new ArgumentNullException(nameof(paymentService));
    private readonly ILogger<StripeWebhookController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    private readonly string _webhookSecret = stripeSettings?.Value.WebhookSecret ?? throw new ArgumentNullException(nameof(stripeSettings));

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
                return BadRequest(new { error = "Missing Stripe-Signature header" });
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
                if (paymentIntent is not null)
                {
                    await HandlePaymentSuccessAsync(paymentIntent, cancellationToken);
                }
            }

            return Ok();
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook signature verification failed");
            return BadRequest(new { error = "Invalid signature" });
        }
        catch (InvalidOperationException ex)
        {
            // Business logic failures (e.g., no cart found) — don't retry
            _logger.LogError(ex, "Business logic error processing Stripe webhook");
            return Ok();
        }
        catch (Exception ex)
        {
            // Transient errors (DB timeout, network) — return 500 so Stripe retries
            _logger.LogError(ex, "Transient error processing Stripe webhook");
            return StatusCode(StatusCodes.Status500InternalServerError);
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
