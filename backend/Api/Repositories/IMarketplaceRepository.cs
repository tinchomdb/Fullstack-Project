using Api.Models;

namespace Api.Repositories;

public interface IMarketplaceRepository
{
    // Products - Partitioned by SellerId
    Task<IReadOnlyList<Product>> GetProductsBySellerAsync(string sellerId, CancellationToken cancellationToken = default);

    Task<Product?> GetProductAsync(string productId, string sellerId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> GetProductsByCategoryAsync(string categoryId, CancellationToken cancellationToken = default);

    Task<Product> CreateProductAsync(Product product, CancellationToken cancellationToken = default);

    Task<Product> UpdateProductAsync(Product product, CancellationToken cancellationToken = default);

    Task DeleteProductAsync(string productId, string sellerId, CancellationToken cancellationToken = default);

    // Categories - Partitioned by Id
    Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken cancellationToken = default);

    Task<Category?> GetCategoryAsync(string categoryId, CancellationToken cancellationToken = default);

    Task<Category> CreateCategoryAsync(Category category, CancellationToken cancellationToken = default);

    // Carts - Partitioned by UserId (id = userId for point reads)
    Task<Cart?> GetCartByUserAsync(string userId, CancellationToken cancellationToken = default);

    Task<Cart> UpsertCartAsync(Cart cart, CancellationToken cancellationToken = default);

    Task DeleteCartAsync(string userId, CancellationToken cancellationToken = default);

    // Orders - Partitioned by UserId
    Task<IReadOnlyList<Order>> GetOrdersByUserAsync(string userId, CancellationToken cancellationToken = default);

    Task<Order?> GetOrderAsync(string orderId, string userId, CancellationToken cancellationToken = default);

    Task<Order> CreateOrderAsync(Order order, CancellationToken cancellationToken = default);

    Task<Order> UpdateOrderAsync(Order order, CancellationToken cancellationToken = default);

    // Users - Partitioned by Id
    Task<User?> GetUserAsync(string userId, CancellationToken cancellationToken = default);

    Task<User?> GetUserByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<User> CreateUserAsync(User user, CancellationToken cancellationToken = default);

    Task<User> UpdateUserAsync(User user, CancellationToken cancellationToken = default);
}
