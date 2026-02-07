using Api.Extensions;
using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PaymentsController(
    IPaymentService paymentService,
    ILogger<PaymentsController> logger) : ControllerBase
{
    private readonly IPaymentService _paymentService = paymentService ?? throw new ArgumentNullException(nameof(paymentService));
    private readonly ILogger<PaymentsController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    [Authorize]
    [HttpPost("create-intent")]
    [ProducesResponseType(typeof(CreatePaymentIntentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<CreatePaymentIntentResponse>> CreatePaymentIntent(
        [FromBody] CreatePaymentIntentRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null)
        {
            return BadRequest(new { error = "Request body is required" });
        }

        if (request.Amount <= 0)
        {
            return BadRequest(new { error = "Amount must be greater than 0" });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { error = "Email is required" });
        }

        if (string.IsNullOrWhiteSpace(request.CartId))
        {
            return BadRequest(new { error = "CartId is required" });
        }

        try
        {
            var userId = User.GetUserId();

            // Server-side cart validation: ensure amount matches actual cart total
            var cartValidation = await _paymentService.ValidateCartTotalAsync(
                userId, request.Amount, request.ShippingCost, cancellationToken);

            if (!cartValidation.IsValid)
            {
                return BadRequest(new { error = cartValidation.ErrorMessage });
            }

            var response = await _paymentService.CreatePaymentIntentAsync(
                request,
                userId,
                cancellationToken);
            return Ok(response);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Stripe error creating payment intent");
            return BadRequest(new { error = "Payment processing error. Please try again." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create payment intent");
            return StatusCode(500, new { error = "An unexpected error occurred while processing the payment" });
        }
    }
}
