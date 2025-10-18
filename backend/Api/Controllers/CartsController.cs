using Api.Models;
using Api.Models.DTOs;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CartsController(ICartService cartService) : ControllerBase
{
    private readonly ICartService _cartService = cartService ?? throw new ArgumentNullException(nameof(cartService));

    /// <summary>
    /// Get the active cart for a user
    /// </summary>
    [HttpGet("by-user/{userId}/active")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CartResponse>> GetActiveCartByUser(string userId, CancellationToken cancellationToken)
    {
        var cart = await _cartService.GetActiveCartAsync(userId, cancellationToken);
        return Ok(cart);
    }

    /// <summary>
    /// Add a product to the cart - Frontend only sends productId and quantity
    /// </summary>
    [HttpPost("by-user/{userId}/items")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CartResponse>> AddItemToCart(
        string userId,
        [FromBody] AddToCartRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var cart = await _cartService.AddItemToCartAsync(userId, request, cancellationToken);
            return Ok(cart);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Update the quantity of an item in the cart
    /// </summary>
    [HttpPatch("by-user/{userId}/items/{productId}")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CartResponse>> UpdateCartItem(
        string userId,
        string productId,
        [FromBody] UpdateCartItemRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Ensure the productId from route matches the request body
            if (request.ProductId != productId)
            {
                return BadRequest(new { error = "Product ID in route must match request body" });
            }

            var cart = await _cartService.UpdateCartItemAsync(userId, request, cancellationToken);
            return Ok(cart);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Remove an item from the cart
    /// </summary>
    [HttpDelete("by-user/{userId}/items/{productId}")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CartResponse>> RemoveItemFromCart(
        string userId,
        RemoveFromCartRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var cart = await _cartService.RemoveItemFromCartAsync(userId, request, cancellationToken);
            return Ok(cart);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Clear all items from the cart
    /// </summary>
    [HttpDelete("by-user/{userId}")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CartResponse>> ClearCart(string userId, CancellationToken cancellationToken)
    {
        var cart = await _cartService.ClearCartAsync(userId, cancellationToken);
        return Ok(cart);
    }

    /// <summary>
    /// Validate cart before payment - Checks prices, stock, and cart validity
    /// Returns the calculated shipping cost based on subtotal
    /// NOTE: Order creation happens via Stripe webhook after successful payment
    /// </summary>
    [Authorize] // Validation requires authentication
    [HttpPost("by-user/{userId}/validate-checkout")]
    [ProducesResponseType(typeof(CartValidationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CartValidationResponse>> ValidateCheckout(
        string userId,
        CancellationToken cancellationToken)
    {
        try
        {
            var validationResult = await _cartService.ValidateCartForCheckoutAsync(
                userId,
                cancellationToken);
            
            return Ok(validationResult);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Migrate guest cart to authenticated user cart
    /// </summary>
    [Authorize] // Cart migration requires authentication (user must be logged in)
    [HttpPost("migrate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> MigrateGuestCart(
        [FromBody] MigrateCartRequest request,
        CancellationToken cancellationToken)
    {
        await _cartService.MigrateGuestCartAsync(request.GuestId, request.UserId, cancellationToken);
        return Ok();
    }
}

public sealed record MigrateCartRequest
{
    public string GuestId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
}

public sealed record CartValidationResponse
{
    public bool IsValid { get; init; }
    public string CartId { get; init; } = string.Empty;
    public decimal Subtotal { get; init; }
    public decimal ShippingCost { get; init; }
    public decimal Total { get; init; }
    public List<string> Warnings { get; init; } = [];
}
