using Api.Models;

namespace Api.Repositories;

public interface IProductsRepository
{
    Task<IReadOnlyList<Product>> GetAllProductsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> GetProductsBySellerAsync(string sellerId, CancellationToken cancellationToken = default);

    Task<Product?> GetProductAsync(string productId, string sellerId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> GetProductsByCategoryAsync(string categoryId, CancellationToken cancellationToken = default);

    Task<Product> CreateProductAsync(Product product, CancellationToken cancellationToken = default);

    Task<Product> UpdateProductAsync(Product product, CancellationToken cancellationToken = default);

    Task DeleteProductAsync(string productId, string sellerId, CancellationToken cancellationToken = default);
}
