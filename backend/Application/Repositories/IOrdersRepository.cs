using Domain.Entities;

namespace Application.Repositories;

public interface IOrdersRepository
{
    Task<IReadOnlyList<Order>> GetOrdersByUserAsync(string userId, CancellationToken cancellationToken = default);

    Task<Order?> GetOrderAsync(string orderId, string userId, CancellationToken cancellationToken = default);

    Task<Order> CreateOrderAsync(Order order, CancellationToken cancellationToken = default);

    Task<Order> UpdateOrderAsync(Order order, CancellationToken cancellationToken = default);
}