using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CartsController(ICartsRepository cartsRepository, IOrdersRepository ordersRepository) : ControllerBase
{
    private readonly ICartsRepository cartsRepository = cartsRepository ?? throw new ArgumentNullException(nameof(cartsRepository));
    private readonly IOrdersRepository ordersRepository = ordersRepository ?? throw new ArgumentNullException(nameof(ordersRepository));

    [HttpGet("by-user/{userId}/active")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Cart>> GetActiveCartByUser(string userId, CancellationToken cancellationToken)
    {
        var activeCart = await cartsRepository.GetActiveCartByUserAsync(userId, cancellationToken);

        if (activeCart is null)
        {
            // Create new active cart
            activeCart = new Cart
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Status = CartStatus.Active,
                Items = [],
                CreatedAt = DateTime.UtcNow,
                LastUpdatedAt = DateTime.UtcNow,
                Subtotal = 0m,
                Total = 0m,
                Currency = "USD"
            };

            activeCart = await cartsRepository.UpsertCartAsync(activeCart, cancellationToken);
        }

        return Ok(activeCart);
    }

    [HttpGet("admin/all-carts")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Cart>>> GetAllCarts(CancellationToken cancellationToken)
    {
        var carts = await cartsRepository.GetAllCartsAsync(cancellationToken);
        return Ok(carts);
    }

    [HttpPut("by-user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Cart>> UpsertCart(string userId, [FromBody] Cart cart, CancellationToken cancellationToken)
    {
        if (cart.UserId != userId)
        {
            return BadRequest("Cart userId must match route parameter");
        }

        // Update the LastUpdatedAt timestamp
        var updatedCart = cart with { LastUpdatedAt = DateTime.UtcNow };
        var upsertedCart = await cartsRepository.UpsertCartAsync(updatedCart, cancellationToken);
        return Ok(upsertedCart);
    }

    [HttpPost("by-user/{userId}/checkout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Order>> CheckoutCart(string userId, [FromBody] CheckoutRequest request, CancellationToken cancellationToken)
    {
        var cart = await cartsRepository.GetActiveCartByUserAsync(userId, cancellationToken);

        if (cart is null)
        {
            return NotFound($"No active cart found for user {userId}");
        }

        if (cart.Id != request.CartId)
        {
            return BadRequest("The provided cart ID does not match the user's active cart");
        }

        if (cart.Status != CartStatus.Active)
        {
            return BadRequest("Only active carts can be checked out");
        }

        if (cart.Items.Count == 0)
        {
            return BadRequest("Cannot checkout an empty cart");
        }

        // Mark cart as completed
        var completedCart = cart with 
        { 
            Status = CartStatus.Completed,
            LastUpdatedAt = DateTime.UtcNow
        };
        await cartsRepository.UpsertCartAsync(completedCart, cancellationToken);

        // Create order from cart
        var order = new Order
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            OriginalCartId = cart.Id,
            OrderDate = DateTime.UtcNow,
            Status = OrderStatus.Pending,
            Items = cart.Items.Select(cartItem => new OrderItem
            {
                ProductId = cartItem.ProductId,
                ProductName = cartItem.ProductName,
                Quantity = cartItem.Quantity,
                UnitPrice = cartItem.UnitPrice,
                LineTotal = cartItem.LineTotal
            }).ToList(),
            Subtotal = cart.Subtotal,
            ShippingCost = request.ShippingCost,
            Total = cart.Total + request.ShippingCost,
            Currency = cart.Currency
        };

        var createdOrder = await ordersRepository.CreateOrderAsync(order, cancellationToken);
        return Ok(createdOrder);
    }

    [HttpDelete("by-user/{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCart(string userId, CancellationToken cancellationToken)
    {
        await cartsRepository.DeleteCartAsync(userId, cancellationToken);
        return NoContent();
    }
}

public sealed record CheckoutRequest
{
    public string CartId { get; init; } = string.Empty;
    public decimal ShippingCost { get; init; } = 0m;
}
