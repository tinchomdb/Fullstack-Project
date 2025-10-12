using Api.Models;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Api.Configuration;

namespace Api.Repositories;

public class CachedCarouselSlidesRepository : ICarouselSlidesRepository
{
    private readonly ICarouselSlidesRepository _inner;
    private readonly IMemoryCache _cache;
    private readonly CacheSettings _cacheSettings;
    private readonly ILogger<CachedCarouselSlidesRepository> _logger;

    private const string AllSlidesKey = "carousel_slides_all";
    private const string ActiveSlidesKey = "carousel_slides_active";
    private const string SlideKeyPrefix = "carousel_slide_";

    public CachedCarouselSlidesRepository(
        ICarouselSlidesRepository inner,
        IMemoryCache cache,
        IOptions<CacheSettings> cacheSettings,
        ILogger<CachedCarouselSlidesRepository> logger)
    {
        _inner = inner;
        _cache = cache;
        _cacheSettings = cacheSettings.Value;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CarouselSlide>> GetAllSlidesAsync(CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetAllSlidesAsync(cancellationToken);
        }

        return await _cache.GetOrCreateAsync(
            AllSlidesKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.CarouselSlidesExpirationMinutes);
                _logger.LogInformation("Cache miss for all carousel slides. Fetching from database.");
                return await _inner.GetAllSlidesAsync(cancellationToken);
            }) ?? [];
    }

    public async Task<IReadOnlyList<CarouselSlide>> GetActiveSlidesAsync(CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetActiveSlidesAsync(cancellationToken);
        }

        return await _cache.GetOrCreateAsync(
            ActiveSlidesKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.CarouselSlidesExpirationMinutes);
                _logger.LogInformation("Cache miss for active carousel slides. Fetching from database.");
                return await _inner.GetActiveSlidesAsync(cancellationToken);
            }) ?? [];
    }

    public async Task<CarouselSlide?> GetSlideAsync(string slideId, CancellationToken cancellationToken = default)
    {
        if (!_cacheSettings.EnableCaching)
        {
            return await _inner.GetSlideAsync(slideId, cancellationToken);
        }

        var cacheKey = $"{SlideKeyPrefix}{slideId}";
        
        return await _cache.GetOrCreateAsync(
            cacheKey,
            async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_cacheSettings.SingleItemExpirationMinutes);
                _logger.LogInformation("Cache miss for carousel slide {SlideId}. Fetching from database.", slideId);
                return await _inner.GetSlideAsync(slideId, cancellationToken);
            });
    }

    public async Task<CarouselSlide> CreateSlideAsync(CarouselSlide slide, CancellationToken cancellationToken = default)
    {
        var result = await _inner.CreateSlideAsync(slide, cancellationToken);
        
        // Invalidate cache
        InvalidateAllSlidesCaches();
        _logger.LogInformation("Cache invalidated after creating carousel slide {SlideId}.", slide.Id);
        
        return result;
    }

    public async Task<CarouselSlide> UpdateSlideAsync(CarouselSlide slide, CancellationToken cancellationToken = default)
    {
        var result = await _inner.UpdateSlideAsync(slide, cancellationToken);
        
        // Invalidate cache
        InvalidateAllSlidesCaches();
        _cache.Remove($"{SlideKeyPrefix}{slide.Id}");
        _logger.LogInformation("Cache invalidated after updating carousel slide {SlideId}.", slide.Id);
        
        return result;
    }

    public async Task DeleteSlideAsync(string slideId, CancellationToken cancellationToken = default)
    {
        await _inner.DeleteSlideAsync(slideId, cancellationToken);
        
        // Invalidate cache
        InvalidateAllSlidesCaches();
        _cache.Remove($"{SlideKeyPrefix}{slideId}");
        _logger.LogInformation("Cache invalidated after deleting carousel slide {SlideId}.", slideId);
    }

    public async Task<IReadOnlyList<CarouselSlide>> ReorderSlidesAsync(string[] slideIds, CancellationToken cancellationToken = default)
    {
        var result = await _inner.ReorderSlidesAsync(slideIds, cancellationToken);
        
        // Invalidate cache
        InvalidateAllSlidesCaches();
        _logger.LogInformation("Cache invalidated after reordering carousel slides.");
        
        return result;
    }

    private void InvalidateAllSlidesCaches()
    {
        _cache.Remove(AllSlidesKey);
        _cache.Remove(ActiveSlidesKey);
    }
}
