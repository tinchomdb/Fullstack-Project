using Api.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Api.Configuration;

namespace Api.Repositories;

public class CachedProductsRepository : IProductsRepository
{
    private readonly IProductsRepository _inner;
    private readonly IMemoryCache _cache;
    private readonly CacheSettings _cacheSettings;
    private readonly ILogger<CachedProductsRepository> _logger;

    private const string AllProductsKey = "products_all";
    private const string ProductKeyPrefix = "product_";
    private const string ProductsBySellerPrefix = "products_seller_";
    private const string ProductsByCategoryPrefix = "products_category_";
    private const string ProductsByCategoriesPrefix = "products_categories_";

    public CachedProductsRepository(
        IProductsRepository inner,
        IMemoryCache cache,
        IOptions<CacheSettings> cacheSettings,
        ILogger<CachedProductsRepository> logger)
    {
        _inner = inner;
        _cache = cache;
        _cacheSettings = cacheSettings.Value;
        _logger = logger;
    }

    public async Task<IReadOnlyList<Product>> GetAllProductsAsync(CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetAllProductsAsync(cancellationToken);
        }

        return await _cache.GetOrCreateAsync(
            AllProductsKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.ProductsExpirationMinutes);
                _logger.LogInformation("Cache miss for all products. Fetching from database.");
                return await _inner.GetAllProductsAsync(cancellationToken);
            }) ?? [];
    }

    public async Task<IReadOnlyList<Product>> GetProductsBySellerAsync(string sellerId, CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetProductsBySellerAsync(sellerId, cancellationToken);
        }

        var cacheKey = $"{ProductsBySellerPrefix}{sellerId}";
        
        return await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.ProductsExpirationMinutes);
                _logger.LogInformation("Cache miss for products by seller {SellerId}. Fetching from database.", sellerId);
                return await _inner.GetProductsBySellerAsync(sellerId, cancellationToken);
            }) ?? [];
    }

    public async Task<Product?> GetProductAsync(string productId, string sellerId, CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetProductAsync(productId, sellerId, cancellationToken);
        }

        var cacheKey = $"{ProductKeyPrefix}{productId}_{sellerId}";
        
        return await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.SingleItemExpirationMinutes);
                _logger.LogInformation("Cache miss for product {ProductId} by seller {SellerId}. Fetching from database.", productId, sellerId);
                return await _inner.GetProductAsync(productId, sellerId, cancellationToken);
            });
    }

    public async Task<IReadOnlyList<Product>> GetProductsByCategoryAsync(string categoryId, CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetProductsByCategoryAsync(categoryId, cancellationToken);
        }

        var cacheKey = $"{ProductsByCategoryPrefix}{categoryId}";
        
        return await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.ProductsExpirationMinutes);
                _logger.LogInformation("Cache miss for products by category {CategoryId}. Fetching from database.", categoryId);
                return await _inner.GetProductsByCategoryAsync(categoryId, cancellationToken);
            }) ?? [];
    }

    public async Task<IReadOnlyList<Product>> GetProductsByCategoriesAsync(string[] categoryIds, CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetProductsByCategoriesAsync(categoryIds, cancellationToken);
        }

        var cacheKey = $"{ProductsByCategoriesPrefix}{string.Join("_", categoryIds.OrderBy(x => x))}";
        
        return await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.ProductsExpirationMinutes);
                _logger.LogInformation("Cache miss for products by multiple categories. Fetching from database.");
                return await _inner.GetProductsByCategoriesAsync(categoryIds, cancellationToken);
            }) ?? [];
    }

    public async Task<Product> CreateProductAsync(Product product, CancellationToken cancellationToken = default)
    {
        var result = await _inner.CreateProductAsync(product, cancellationToken);
        
        // Invalidate related caches
        InvalidateProductCaches(product);
        _logger.LogInformation("Cache invalidated after creating product {ProductId}.", product.Id);
        
        return result;
    }

    public async Task<Product> UpdateProductAsync(Product product, CancellationToken cancellationToken = default)
    {
        var result = await _inner.UpdateProductAsync(product, cancellationToken);
        
        // Invalidate related caches
        InvalidateProductCaches(product);
        _logger.LogInformation("Cache invalidated after updating product {ProductId}.", product.Id);
        
        return result;
    }

    public async Task DeleteProductAsync(string productId, string sellerId, CancellationToken cancellationToken = default)
    {
        await _inner.DeleteProductAsync(productId, sellerId, cancellationToken);
        
        // Invalidate caches - we don't have the full product so invalidate broadly
        _cache.Remove(AllProductsKey);
        _cache.Remove($"{ProductKeyPrefix}{productId}_{sellerId}");
        _cache.Remove($"{ProductsBySellerPrefix}{sellerId}");
        _logger.LogInformation("Cache invalidated after deleting product {ProductId}.", productId);
    }

    private void InvalidateProductCaches(Product product)
    {
        _cache.Remove(AllProductsKey);
        _cache.Remove($"{ProductKeyPrefix}{product.Id}_{product.Seller.Id}");
        _cache.Remove($"{ProductsBySellerPrefix}{product.Seller.Id}");
        
        // Invalidate category-based caches
        foreach (var categoryId in product.CategoryIds)
        {
            _cache.Remove($"{ProductsByCategoryPrefix}{categoryId}");
        }
    }
}
