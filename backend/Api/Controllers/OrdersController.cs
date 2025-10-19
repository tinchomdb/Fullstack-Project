using Api.Extensions;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class OrdersController(IOrderService orderService) : ControllerBase
{
    private readonly IOrderService _orderService = orderService ?? throw new ArgumentNullException(nameof(orderService));

    /// <summary>
    /// Get all orders for the authenticated user.
    /// </summary>
    [HttpGet("my-orders")]
    [ProducesResponseType(typeof(IReadOnlyList<Order>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Order>>> GetMyOrders(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var orders = await _orderService.GetOrdersByUserAsync(userId, cancellationToken);
        return Ok(orders);
    }

    /// <summary>
    /// Get a specific order by ID for the authenticated user.
    /// </summary>
    [HttpGet("{orderId}")]
    [ProducesResponseType(typeof(Order), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Order>> GetMyOrder(
        string orderId,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        var order = await _orderService.GetOrderAsync(orderId, userId, cancellationToken);

        if (order is null)
        {
            return NotFound();
        }

        return Ok(order);
    }
}
