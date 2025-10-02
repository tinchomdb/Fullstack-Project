using Api.Models;

namespace Api.Repositories;

public interface ICartsRepository
{
    Task<Cart?> GetCartByUserAsync(string userId, CancellationToken cancellationToken = default);

    Task<Cart> UpsertCartAsync(Cart cart, CancellationToken cancellationToken = default);

    Task DeleteCartAsync(string userId, CancellationToken cancellationToken = default);
}
