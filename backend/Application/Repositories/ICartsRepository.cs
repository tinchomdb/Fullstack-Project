using Domain.Entities;

namespace Application.Repositories;

public interface ICartsRepository
{
    Task<Cart?> GetActiveCartByUserAsync(string userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Cart>> GetAllCartsAsync(CancellationToken cancellationToken = default);

    Task<Cart> UpsertCartAsync(Cart cart, CancellationToken cancellationToken = default);

    Task DeleteCartAsync(string userId, CancellationToken cancellationToken = default);
}