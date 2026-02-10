using Application.Repositories;
using Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class OrderService(
    IOrdersRepository ordersRepository,
    ILogger<OrderService> logger) : IOrderService
{
    private readonly IOrdersRepository _ordersRepository = ordersRepository ??
        throw new ArgumentNullException(nameof(ordersRepository));
    private readonly ILogger<OrderService> _logger = logger ??
        throw new ArgumentNullException(nameof(logger));

    public async Task<IReadOnlyList<Order>> GetOrdersByUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving orders for user: {UserId}", userId);
        return await _ordersRepository.GetOrdersByUserAsync(userId, cancellationToken);
    }

    public async Task<Order?> GetOrderAsync(
        string orderId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving order: {OrderId} for user: {UserId}", orderId, userId);
        return await _ordersRepository.GetOrderAsync(orderId, userId, cancellationToken);
    }

    public async Task<Order> CreateOrderAsync(
        Order order,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating order for user: {UserId}", order.UserId);
        var createdOrder = await _ordersRepository.CreateOrderAsync(order, cancellationToken);
        _logger.LogInformation("Order created successfully: {OrderId}", createdOrder.Id);
        return createdOrder;
    }

    public async Task<Order> UpdateOrderAsync(
        Order order,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating order: {OrderId} for user: {UserId}", order.Id, order.UserId);
        var updatedOrder = await _ordersRepository.UpdateOrderAsync(order, cancellationToken);
        _logger.LogInformation("Order updated successfully: {OrderId}", updatedOrder.Id);
        return updatedOrder;
    }

    public async Task<Order?> GetOrderByPaymentIntentIdAsync(
        string paymentIntentId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving order by payment intent: {PaymentIntentId}", paymentIntentId);
        return await _ordersRepository.GetOrderByPaymentIntentIdAsync(paymentIntentId, cancellationToken);
    }
}