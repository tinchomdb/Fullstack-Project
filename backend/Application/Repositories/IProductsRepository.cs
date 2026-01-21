using Domain.Entities;

namespace Application.Repositories;

public interface IProductsRepository
{
    Task<PaginatedResponse<Product>> GetProductsAsync(ProductQueryParameters parameters, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> GetAllProductsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> GetProductsBySellerAsync(string sellerId, CancellationToken cancellationToken = default);

    Task<Product?> GetProductAsync(string productId, string sellerId, CancellationToken cancellationToken = default);

    Task<Product?> GetProductBySlugAsync(string slug, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Product>> GetFeaturedProductsAsync(string? categoryId = null, int limit = 20, CancellationToken cancellationToken = default);

    Task<Product> CreateProductAsync(Product product, CancellationToken cancellationToken = default);

    Task<Product> UpdateProductAsync(Product product, CancellationToken cancellationToken = default);

    Task DeleteProductAsync(string productId, string sellerId, CancellationToken cancellationToken = default);
}