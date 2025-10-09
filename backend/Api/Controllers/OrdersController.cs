using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All order endpoints require authentication
public sealed class OrdersController(IOrdersRepository repository) : ControllerBase
{
    private readonly IOrdersRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet("by-user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Order>>> GetOrdersByUser(string userId, CancellationToken cancellationToken)
    {
        var orders = await repository.GetOrdersByUserAsync(userId, cancellationToken);
        return Ok(orders);
    }

    [HttpGet("{orderId}/user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Order>> GetOrder(string orderId, string userId, CancellationToken cancellationToken)
    {
        var order = await repository.GetOrderAsync(orderId, userId, cancellationToken);

        if (order is null)
        {
            return NotFound();
        }

        return Ok(order);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<Order>> CreateOrder([FromBody] Order order, CancellationToken cancellationToken)
    {
        var createdOrder = await repository.CreateOrderAsync(order, cancellationToken);
        return CreatedAtAction(nameof(GetOrder), new { orderId = createdOrder.Id, userId = createdOrder.UserId }, createdOrder);
    }

    [HttpPut("{orderId}/user/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Order>> UpdateOrder(string orderId, string userId, [FromBody] Order order, CancellationToken cancellationToken)
    {
        if (order.Id != orderId || order.UserId != userId)
        {
            return BadRequest("Order ID and UserId must match route parameters");
        }

        var updatedOrder = await repository.UpdateOrderAsync(order, cancellationToken);
        return Ok(updatedOrder);
    }
}
