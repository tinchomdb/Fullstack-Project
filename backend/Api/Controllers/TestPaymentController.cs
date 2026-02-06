using Api.DTOs;
using Api.Extensions;
using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Test controller for webhook and payment flow testing
/// ONLY for development/testing - remove before production
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class TestPaymentController(
    IPaymentService paymentService,
    ICartService cartService,
    ILogger<TestPaymentController> logger) : ControllerBase
{
    private readonly IPaymentService _paymentService = paymentService ?? throw new ArgumentNullException(nameof(paymentService));
    private readonly ICartService _cartService = cartService ?? throw new ArgumentNullException(nameof(cartService));
    private readonly ILogger<TestPaymentController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    /// Create a payment intent with cart and user metadata for testing webhooks
    /// This simulates what the frontend will send
    /// </summary>
    [HttpPost("create-payment-with-metadata")]
    public async Task<ActionResult<CreatePaymentIntentResponse>> CreatePaymentWithMetadata(
        [FromBody] TestPaymentRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Validate cart exists using CartService
            var cart = await _cartService.GetActiveCartAsync(request.UserId, cancellationToken);
            if (cart.Items.Count == 0)
            {
                return BadRequest(new { error = "Cart is empty" });
            }

            _logger.LogInformation(
                "Creating payment intent for testing with cartId={CartId}, userId={UserId}",
                cart.Id, request.UserId);

            // Create payment intent WITH metadata (this is the key difference)
            var response = await _paymentService.CreatePaymentIntentAsync(
                new CreatePaymentIntentRequest
                {
                    Amount = request.Amount,
                    Email = request.Email
                },
                request.UserId,
                cancellationToken);

            return Ok(new
            {
                message = "Payment intent created with cart metadata. Now trigger webhook with: stripe trigger payment_intent.succeeded",
                clientSecret = response.ClientSecret,
                amount = response.Amount,
                cartId = cart.Id,
                userId = request.UserId,
                cartItems = cart.Items.Count
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating test payment");
            return StatusCode(500, new { error = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Simulate the complete payment flow for testing
    /// Creates a payment intent, logs the details, and tells you what to do next
    /// </summary>
    [HttpPost("simulate-payment-flow")]
    public async Task<ActionResult> SimulatePaymentFlow(
        [FromBody] TestPaymentRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Step 1: Get cart using CartService
            var cart = await _cartService.GetActiveCartAsync(request.UserId, cancellationToken);
            if (cart.Items.Count == 0)
            {
                return BadRequest(new { error = "Cart is empty" });
            }

            _logger.LogInformation("=== TESTING PAYMENT FLOW ===");
            _logger.LogInformation(
                "Cart: {CartId}, Items: {ItemCount}, Total: {Total}",
                cart.Id, cart.Items.Count, cart.Total);

            // Step 2: Validate cart before payment
            var validationResult = await _cartService.ValidateCartForCheckoutAsync(
                request.UserId,
                cancellationToken);

            if (!validationResult.IsValid)
            {
                return BadRequest(new { error = "Cart validation failed", warnings = validationResult.Warnings });
            }

            _logger.LogInformation("Step 1: Cart is valid with subtotal {Subtotal}, shipping {Shipping}",
                validationResult.Subtotal, validationResult.ShippingCost);

            // Step 3: Create payment intent WITH metadata
            var paymentResponse = await _paymentService.CreatePaymentIntentAsync(
                new CreatePaymentIntentRequest
                {
                    Amount = request.Amount,
                    Email = request.Email
                },
                request.UserId,
                cancellationToken);

            _logger.LogInformation(
                "Step 2: Payment intent created - {PaymentIntentId}",
                paymentResponse.PaymentIntentId);

            return Ok(new
            {
                status = "Payment flow simulation started",
                steps = new[]
                {
                    "✅ Step 1: Cart validated",
                    "✅ Step 2: Payment intent created WITH cart metadata (cartId + userId)",
                    "⏳ Step 3: Now trigger webhook to simulate Stripe callback"
                },
                paymentIntentId = paymentResponse.PaymentIntentId,
                testData = new
                {
                    cartId = cart.Id,
                    userId = request.UserId,
                    cartItems = cart.Items.Count,
                    subtotal = validationResult.Subtotal,
                    shippingCost = validationResult.ShippingCost,
                    total = validationResult.Total,
                    email = request.Email
                },
                nextStep = "Run in Terminal 3: stripe trigger payment_intent.succeeded",
                expectedResult = "Order should be created with PaymentIntentId stored"
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Invalid operation in payment flow simulation");
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in payment flow simulation");
            return StatusCode(500, new { error = "An unexpected error occurred" });
        }
    }

    /// <summary>
    /// Complete payment test - Directly invokes payment service (LOCAL TESTING ONLY)
    /// This simulates Stripe webhook delivery for local frontend testing
    /// </summary>
    [Authorize]
    [HttpPost("test/complete-payment")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> CompleteTestPayment(
        [FromBody] TestCompletePaymentRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();

            _logger.LogInformation(
                "=== LOCAL PAYMENT COMPLETION TEST ===");
            _logger.LogInformation(
                "Simulating webhook for user {UserId}, payment {PaymentIntentId}",
                userId, request.PaymentIntentId);

            // Invoke the payment service (same as webhook would do)
            var order = await _paymentService.ProcessPaymentSuccessAsync(
                request.PaymentIntentId,
                userId,
                request.Email,
                cancellationToken);

            return Ok(new
            {
                success = true,
                message = "Payment completed successfully",
                orderId = order.Id,
                paymentIntentId = request.PaymentIntentId
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Invalid operation during test payment");
            return BadRequest(new { success = false, error = "Invalid operation" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing test payment");
            return StatusCode(500, new { success = false, error = "An unexpected error occurred" });
        }
    }
}
