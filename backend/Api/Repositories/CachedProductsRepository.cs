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
    private const string ProductsSearchPrefix = "products_search_";
    private const string ProductsFeaturedPrefix = "products_featured_";

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

    public async Task<PaginatedResponse<Product>> GetProductsAsync(
        ProductQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        // Only cache search results (search queries are more expensive than filtered queries)
        if (!_cacheSettings.EnableCaching || !parameters.IsSearching)
        {
            return await _inner.GetProductsAsync(parameters, cancellationToken);
        }

        var cacheKey = GenerateSearchCacheKey(parameters);

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.ProductsExpirationMinutes);
                _logger.LogInformation("Cache miss for search term: {SearchTerm}. Fetching from database.", parameters.SearchTerm);
                return await _inner.GetProductsAsync(parameters, cancellationToken);
            }) ?? new PaginatedResponse<Product>([], 0, parameters.Page, parameters.PageSize);
    }

    private static string GenerateSearchCacheKey(ProductQueryParameters parameters)
    {
        var searchTerm = parameters.SearchTerm?.Trim().ToLowerInvariant() ?? string.Empty;
        var sortBy = parameters.SortBy?.ToLowerInvariant() ?? "name";
        var sortDirection = parameters.SortDirection?.ToLowerInvariant() ?? "asc";
        
        return $"{ProductsSearchPrefix}{searchTerm}_{sortBy}_{sortDirection}_{parameters.Page}_{parameters.PageSize}";
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

    public async Task<Product?> GetProductBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetProductBySlugAsync(slug, cancellationToken);
        }

        var cacheKey = $"product_slug_{slug}";
        
        return await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.SingleItemExpirationMinutes);
                _logger.LogInformation("Cache miss for product by slug {Slug}. Fetching from database.", slug);
                return await _inner.GetProductBySlugAsync(slug, cancellationToken);
            });
    }

    public async Task<IReadOnlyList<Product>> GetFeaturedProductsAsync(string? categoryId = null, int limit = 20, CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetFeaturedProductsAsync(categoryId, limit, cancellationToken);
        }

        var cacheKey = string.IsNullOrEmpty(categoryId) 
            ? $"{ProductsFeaturedPrefix}all_{limit}" 
            : $"{ProductsFeaturedPrefix}{categoryId}_{limit}";
        
        return await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.ProductsExpirationMinutes);
                _logger.LogInformation("Cache miss for featured products{Category} (limit: {Limit}). Fetching from database.", 
                    string.IsNullOrEmpty(categoryId) ? "" : $" in category {categoryId}", limit);
                return await _inner.GetFeaturedProductsAsync(categoryId, limit, cancellationToken);
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
        
        // Invalidate slug-based cache
        if (!string.IsNullOrEmpty(product.Slug))
        {
            _cache.Remove($"product_slug_{product.Slug}");
        }

        // Invalidate featured products cache if the product is featured
        if (product.Featured)
        {
            _cache.Remove($"{ProductsFeaturedPrefix}all");
            
            foreach (var categoryId in product.CategoryIds)
            {
                _cache.Remove($"{ProductsFeaturedPrefix}{categoryId}");
            }
        }
    }
}
