using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CartsController(IMarketplaceRepository repository) : ControllerBase
{
    private readonly IMarketplaceRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<Cart>> GetCarts()
    {
        var carts = repository.GetCarts();
        return Ok(carts);
    }

    [HttpGet("current")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<Cart> GetCurrentCart()
    {
        var carts = repository.GetCarts();
        var defaultCart = carts.Count > 0 ? carts[0] : null;

        if (defaultCart is null)
        {
            return Ok(new Cart
            {
                Id = Guid.NewGuid(),
                UserId = Guid.Empty,
                LastUpdatedAt = DateTime.UtcNow,
                Currency = "USD",
                Subtotal = 0m,
                Total = 0m,
                Items = []
            });
        }

        return Ok(defaultCart);
    }

    [HttpGet("{cartId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Cart> GetCart(Guid cartId)
    {
        var cart = repository.GetCart(cartId);

        if (cart is null)
        {
            return NotFound();
        }

        return Ok(cart);
    }

    [HttpGet("by-user/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Cart> GetCartByUser(Guid userId)
    {
        var cart = repository.GetCartByUser(userId);

        if (cart is null)
        {
            return NotFound();
        }

        return Ok(cart);
    }
}
