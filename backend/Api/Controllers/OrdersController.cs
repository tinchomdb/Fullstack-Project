using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class OrdersController : ControllerBase
{
    private readonly IMarketplaceRepository repository;

    public OrdersController(IMarketplaceRepository repository)
    {
        this.repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<Order>> GetOrders()
    {
        var orders = repository.GetOrders();
        return Ok(orders);
    }

    [HttpGet("{orderId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Order> GetOrder(Guid orderId)
    {
        var order = repository.GetOrder(orderId);

        if (order is null)
        {
            return NotFound();
        }

        return Ok(order);
    }

    [HttpGet("by-user/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<Order>> GetOrdersByUser(Guid userId)
    {
        var orders = repository.GetOrdersByUser(userId);
        return Ok(orders);
    }
}
