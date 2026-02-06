using Application.Repositories;
using Domain.Entities;
using Infrastructure.Configuration;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Repositories;

public sealed class CachedCategoriesRepository : ICategoriesRepository
{
    private readonly ICategoriesRepository _inner;
    private readonly IMemoryCache _cache;
    private readonly CacheSettings _cacheSettings;
    private readonly ILogger<CachedCategoriesRepository> _logger;

    private const string AllCategoriesKey = "categories_all";
    private const string CategoryKeyPrefix = "category_";

    public CachedCategoriesRepository(
        ICategoriesRepository inner,
        IMemoryCache cache,
        IOptions<CacheSettings> cacheSettings,
        ILogger<CachedCategoriesRepository> logger)
    {
        _inner = inner;
        _cache = cache;
        _cacheSettings = cacheSettings.Value;
        _logger = logger;
    }

    public async Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetCategoriesAsync(cancellationToken);
        }

        return await _cache.GetOrCreateAsync(
            AllCategoriesKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.CategoriesExpirationMinutes);
                _logger.LogInformation("Cache miss for all categories. Fetching from database.");
                return await _inner.GetCategoriesAsync(cancellationToken);
            }) ?? [];
    }

    public async Task<Category?> GetCategoryAsync(string categoryId, CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetCategoryAsync(categoryId, cancellationToken);
        }

        var cacheKey = $"{CategoryKeyPrefix}{categoryId}";

        return await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.SingleItemExpirationMinutes);
                _logger.LogInformation("Cache miss for category {CategoryId}. Fetching from database.", categoryId);
                return await _inner.GetCategoryAsync(categoryId, cancellationToken);
            });
    }

    public async Task<Category> CreateCategoryAsync(Category category, CancellationToken cancellationToken = default)
    {
        var result = await _inner.CreateCategoryAsync(category, cancellationToken);

        // Invalidate cache
        _cache.Remove(AllCategoriesKey);
        _logger.LogInformation("Cache invalidated after creating category {CategoryId}.", category.Id);

        return result;
    }

    public async Task<Category?> UpdateCategoryAsync(Category category, CancellationToken cancellationToken = default)
    {
        var result = await _inner.UpdateCategoryAsync(category, cancellationToken);

        // Invalidate cache
        _cache.Remove(AllCategoriesKey);
        _cache.Remove($"{CategoryKeyPrefix}{category.Id}");
        _logger.LogInformation("Cache invalidated after updating category {CategoryId}.", category.Id);

        return result;
    }

    public async Task DeleteCategoryAsync(string categoryId, CancellationToken cancellationToken = default)
    {
        await _inner.DeleteCategoryAsync(categoryId, cancellationToken);

        // Invalidate cache
        _cache.Remove(AllCategoriesKey);
        _cache.Remove($"{CategoryKeyPrefix}{categoryId}");
        _logger.LogInformation("Cache invalidated after deleting category {CategoryId}.", categoryId);
    }

    public async Task<IReadOnlyList<string>> GetAllDescendantCategoryIdsAsync(
        string categoryId,
        CancellationToken cancellationToken = default)
    {
        return await _inner.GetAllDescendantCategoryIdsAsync(categoryId, cancellationToken);
    }

    public async Task<IReadOnlyList<Category>> GetChildrenCategoriesAsync(
        string? parentCategoryId,
        CancellationToken cancellationToken = default)
    {
        return await _inner.GetChildrenCategoriesAsync(parentCategoryId, cancellationToken);
    }
}