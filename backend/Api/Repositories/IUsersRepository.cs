using Api.Models;

namespace Api.Repositories;

public interface IUsersRepository
{
    Task<User?> GetUserAsync(string userId, CancellationToken cancellationToken = default);

    Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<User> CreateUserAsync(User user, CancellationToken cancellationToken = default);

    Task<User> UpdateUserAsync(User user, CancellationToken cancellationToken = default);
}
