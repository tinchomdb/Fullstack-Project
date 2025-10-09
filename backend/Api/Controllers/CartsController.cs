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
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Cart>> GetActiveCartByUser(string userId, CancellationToken cancellationToken)
    {
        var activeCart = await cartsRepository.GetActiveCartByUserAsync(userId, cancellationToken);

        if (activeCart is null)
        {
            return NotFound();
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
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCart(string userId, CancellationToken cancellationToken)
    {
        try
        {
            await cartsRepository.DeleteCartAsync(userId, cancellationToken);
            return NoContent();
        }
        catch (Exception ex)
        {
            return NotFound($"Could not delete cart for user {userId}: {ex.Message}");
        }
    }

    [HttpPost("migrate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MigrateGuestCart([FromBody] MigrateCartRequest request, CancellationToken cancellationToken)
    {        
        var guestCart = await cartsRepository.GetActiveCartByUserAsync(request.GuestId, cancellationToken);
        
        if (guestCart is null || guestCart.Items.Count == 0)
        {            
            return Ok();
        }

        var userCart = await cartsRepository.GetActiveCartByUserAsync(request.UserId, cancellationToken);
        
        if (userCart is null)
        {            
            userCart = guestCart with 
            { 
                Id = Guid.NewGuid().ToString(),
                UserId = request.UserId,
                LastUpdatedAt = DateTime.UtcNow
            };
        }
        else
        {            
            var mergedItems = userCart.Items.ToList();
            
            foreach (var guestItem in guestCart.Items)
            {
                var existingItem = mergedItems.FirstOrDefault(i => i.ProductId == guestItem.ProductId);
                
                if (existingItem is not null)
                {                    
                    var index = mergedItems.IndexOf(existingItem);
                    var newQuantity = existingItem.Quantity + guestItem.Quantity;
                    mergedItems[index] = existingItem with 
                    { 
                        Quantity = newQuantity,
                        LineTotal = existingItem.UnitPrice * newQuantity
                    };
                }
                else
                {                   
                    mergedItems.Add(guestItem);
                }
            }
            
            var subtotal = mergedItems.Sum(item => item.LineTotal);
            userCart = userCart with 
            { 
                Items = mergedItems,
                Subtotal = subtotal,
                Total = subtotal,
                LastUpdatedAt = DateTime.UtcNow
            };
        }

        await cartsRepository.UpsertCartAsync(userCart, cancellationToken);
       
        try
        {
            await cartsRepository.DeleteCartAsync(request.GuestId, cancellationToken);
        }
        catch
        {
            // Ignore errors when deleting guest cart
        }

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
