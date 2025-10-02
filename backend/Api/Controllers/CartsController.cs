using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CartsController(ICartsRepository repository) : ControllerBase
{
    private readonly ICartsRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet("by-user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Cart>> GetCartByUser(string userId, CancellationToken cancellationToken)
    {
        var cart = await repository.GetCartByUserAsync(userId, cancellationToken);

        if (cart is null)
        {
            // Return empty cart for user
            return Ok(new Cart
            {
                Id = userId,
                UserId = userId,
                Items = [],
                LastUpdatedAt = DateTime.UtcNow,
                Subtotal = 0m,
                Total = 0m,
                Currency = "USD"
            });
        }

        return Ok(cart);
    }

    [HttpPut("by-user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Cart>> UpsertCart(string userId, [FromBody] Cart cart, CancellationToken cancellationToken)
    {
        if (cart.UserId != userId)
        {
            return BadRequest("Cart userId must match route parameter");
        }

        var upsertedCart = await repository.UpsertCartAsync(cart, cancellationToken);
        return Ok(upsertedCart);
    }

    [HttpDelete("by-user/{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteCart(string userId, CancellationToken cancellationToken)
    {
        await repository.DeleteCartAsync(userId, cancellationToken);
        return NoContent();
    }
}
