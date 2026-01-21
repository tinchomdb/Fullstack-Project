using Api.Extensions;
using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CartsController(
    ICartService cartService,
    ILogger<CartsController> logger) : OwnershipValidatedController
{
    private readonly ICartService _cartService = cartService ?? throw new ArgumentNullException(nameof(cartService));
    private readonly ILogger<CartsController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    [Authorize]
    [HttpGet("my-cart")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CartResponse>> GetMyCart(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var cart = await _cartService.GetActiveCartAsync(userId, cancellationToken);
        return Ok(cart);
    }

    [HttpGet("guest-cart")]
    [Authorize(Policy = "GuestOnly")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CartResponse>> GetGuestCart(CancellationToken cancellationToken)
    {
        var guestSessionId = HttpContext.GetGuestSessionId()!;
        var cart = await _cartService.GetActiveCartAsync(guestSessionId, cancellationToken);
        return Ok(cart);
    }
    [HttpPost("my-cart/items")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CartResponse>> AddItemToMyCart(
        [FromBody] AddToCartRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
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
    /// Update the quantity of an item in the authenticated user's cart.
    /// </summary>
    [Authorize]
    [HttpPatch("my-cart/items/{productId}")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CartResponse>> UpdateMyCartItem(
        string productId,
        [FromBody] UpdateCartItemRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (request.ProductId != productId)
            {
                return BadRequest(new { error = "Product ID in route must match request body" });
            }

            var userId = User.GetUserId();
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
    /// Remove an item from the authenticated user's cart.
    /// </summary>
    [Authorize]
    [HttpDelete("my-cart/items/{productId}")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CartResponse>> RemoveItemFromMyCart(
        string productId,
        CancellationToken cancellationToken)
    {
        try
        {
            var userId = User.GetUserId();
            var cart = await _cartService.RemoveItemFromCartAsync(userId, productId, cancellationToken);
            return Ok(cart);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Clear all items from the authenticated user's cart.
    /// </summary>
    [Authorize]
    [HttpDelete("my-cart")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<CartResponse>> ClearMyCart(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var cart = await _cartService.ClearCartAsync(userId, cancellationToken);
        return Ok(cart);
    }

    // ============= GUEST USER ENDPOINTS (MODIFIED) =============

    [HttpPost("guest-cart/items")]
    [Authorize(Policy = "GuestOnly")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CartResponse>> AddItemToGuestCart(
        [FromBody] AddToCartRequest request,
        CancellationToken cancellationToken)
    {
        var guestSessionId = HttpContext.GetGuestSessionId()!;

        try
        {
            var cart = await _cartService.AddItemToCartAsync(guestSessionId, request, cancellationToken);
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

    [HttpPatch("guest-cart/items/{productId}")]
    [Authorize(Policy = "GuestOnly")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CartResponse>> UpdateGuestCartItem(
        string productId,
        [FromBody] UpdateCartItemRequest request,
        CancellationToken cancellationToken)
    {
        if (request.ProductId != productId)
        {
            return BadRequest(new { error = "Product ID in route must match request body" });
        }

        var guestSessionId = HttpContext.GetGuestSessionId()!;

        try
        {
            var cart = await _cartService.UpdateCartItemAsync(guestSessionId, request, cancellationToken);
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

    [HttpDelete("guest-cart/items/{productId}")]
    [Authorize(Policy = "GuestOnly")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CartResponse>> RemoveItemFromGuestCart(
        string productId,
        CancellationToken cancellationToken)
    {
        var guestSessionId = HttpContext.GetGuestSessionId()!;

        try
        {
            var cart = await _cartService.RemoveItemFromCartAsync(guestSessionId, productId, cancellationToken);
            return Ok(cart);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpDelete("guest-cart")]
    [Authorize(Policy = "GuestOnly")]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CartResponse>> ClearGuestCart(CancellationToken cancellationToken)
    {
        var guestSessionId = HttpContext.GetGuestSessionId()!;
        var cart = await _cartService.ClearCartAsync(guestSessionId, cancellationToken);
        return Ok(cart);
    }

    /// <summary>
    /// Validate the authenticated user's cart before payment.
    /// Checks prices, stock, and cart validity.
    /// Returns the calculated shipping cost based on subtotal.
    /// NOTE: Order creation happens via Stripe webhook after successful payment.
    /// </summary>
    [Authorize]
    [HttpPost("my-cart/validate-checkout")]
    [ProducesResponseType(typeof(CartValidationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CartValidationResponse>> ValidateCheckout(
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();

        try
        {
            var result = await _cartService.ValidateCartForCheckoutAsync(
                userId,
                cancellationToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Migrate guest cart to authenticated user cart.
    /// After successful migration, the frontend should discard the guest token.
    /// </summary>
    [Authorize]
    [HttpPost("migrate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> MigrateGuestCart(
        [FromBody] MigrateCartRequest? request,
        CancellationToken cancellationToken)
    {
        // Get authenticated user ID
        var userId = User.GetUserId();

        // Get guest session ID from request body (frontend provides it)
        var guestSessionId = request?.GuestSessionId;
        if (string.IsNullOrEmpty(guestSessionId))
        {
            return BadRequest(new { error = "Guest session ID is required for migration" });
        }

        // Migrate the guest cart to the user's cart
        await _cartService.MigrateGuestCartAsync(guestSessionId, userId, cancellationToken);

        return Ok(new { message = "Guest cart successfully migrated to user account" });
    }

}

public sealed record MigrateCartRequest
{
    public string? GuestSessionId { get; init; }
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
