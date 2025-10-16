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
    /// Checkout the cart and create an order - Validates all prices and stock again
    /// </summary>
    [Authorize] // Checkout requires authentication
    [HttpPost("by-user/{userId}/checkout")]
    [ProducesResponseType(typeof(Order), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Order>> CheckoutCart(
        string userId,
        [FromBody] CheckoutRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var order = await _cartService.CheckoutCartAsync(
                userId,
                request.ShippingCost,
                cancellationToken);
            
            return Ok(order);
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

public sealed record CheckoutRequest
{
    public string CartId { get; init; } = string.Empty;
    public decimal ShippingCost { get; init; } = 0m;
}

public sealed record MigrateCartRequest
{
    public string GuestId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
}
