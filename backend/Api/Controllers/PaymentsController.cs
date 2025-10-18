using Microsoft.AspNetCore.Mvc;
using Api.Models.DTOs;
using Api.Services;
using Stripe;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController(IPaymentService paymentService) : ControllerBase
    {
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
                var response = await paymentService.CreatePaymentIntentAsync(
                    request, 
                    request.CartId, 
                    request.UserId);
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
}
