using Api.Extensions;
using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    private readonly IPaymentService _paymentService = paymentService ?? throw new ArgumentNullException(nameof(paymentService));

    [Authorize]
    [HttpPost("create-intent")]
    public async Task<ActionResult<CreatePaymentIntentResponse>> CreatePaymentIntent(
        [FromBody] CreatePaymentIntentRequest request)
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

        try
        {
            var userId = User.GetUserId();
            var response = await _paymentService.CreatePaymentIntentAsync(
                request,
                userId);
            return Ok(response);
        }
        catch (StripeException ex)
        {
            return BadRequest(new { error = $"Stripe error: {ex.Message}" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = $"Server error: {ex.Message}" });
        }
    }
}
