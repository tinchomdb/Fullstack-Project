using System.Security.Claims;
using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class CartsController(IMarketplaceRepository repository) : ControllerBase
{
    private readonly IMarketplaceRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<Cart>> GetCarts()
    {
        var carts = repository.GetCarts();
        return Ok(carts);
    }

    [HttpGet("{cartId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Cart> GetCart(Guid cartId)
    {
        var cart = repository.GetCart(cartId);

        if (cart is null)
        {
            return NotFound();
        }

        if (!UserIsAdmin())
        {
            if (!TryGetCurrentUserId(out var currentUserId))
            {
                return Forbid();
            }

            if (cart.UserId != currentUserId)
            {
                return Forbid();
            }
        }

        return Ok(cart);
    }

    [HttpGet("by-user/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public ActionResult<Cart> GetCartByUser(Guid userId)
    {
        if (!UserIsAdmin())
        {
            if (!TryGetCurrentUserId(out var currentUserId) || currentUserId != userId)
            {
                return Forbid();
            }
        }

        var cart = repository.GetCartByUser(userId);

        if (cart is null)
        {
            return NotFound();
        }

        return Ok(cart);
    }

    private bool UserIsAdmin()
    {
        return User.IsInRole("Admin");
    }

    private bool TryGetCurrentUserId(out Guid userId)
    {
        var identifierClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                             ?? User.FindFirst("oid")
                             ?? User.FindFirst("sub");

        return Guid.TryParse(identifierClaim?.Value, out userId);
    }
}
