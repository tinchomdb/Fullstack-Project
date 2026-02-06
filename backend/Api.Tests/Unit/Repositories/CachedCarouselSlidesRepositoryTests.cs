using Application.Repositories;
using Domain.Entities;
using Infrastructure.Configuration;
using Infrastructure.Repositories;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace Api.Tests.Unit.Repositories;

public class CachedCarouselSlidesRepositoryTests
{
    private readonly Mock<ICarouselSlidesRepository> _innerRepo;
    private readonly IMemoryCache _cache;
    private readonly CacheSettings _cacheSettings;
    private readonly Mock<ILogger<CachedCarouselSlidesRepository>> _logger;
    private readonly CachedCarouselSlidesRepository _sut;

    public CachedCarouselSlidesRepositoryTests()
    {
        _innerRepo = new Mock<ICarouselSlidesRepository>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _cacheSettings = new CacheSettings
        {
            EnableCaching = true,
            CarouselSlidesExpirationMinutes = 10,
            SingleItemExpirationMinutes = 5
        };
        _logger = new Mock<ILogger<CachedCarouselSlidesRepository>>();

        var options = Options.Create(_cacheSettings);
        _sut = new CachedCarouselSlidesRepository(_innerRepo.Object, _cache, options, _logger.Object);
    }

    // ───── GetAllSlidesAsync ─────

    [Fact]
    public async Task GetAllSlidesAsync_CacheMiss_CallsInnerAndCachesResult()
    {
        var slides = new List<CarouselSlide> { CreateSlide("s1"), CreateSlide("s2") }.AsReadOnly();
        _innerRepo.Setup(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(slides);

        var result1 = await _sut.GetAllSlidesAsync();
        var result2 = await _sut.GetAllSlidesAsync();

        Assert.Equal(2, result1.Count);
        Assert.Equal(2, result2.Count);
        _innerRepo.Verify(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAllSlidesAsync_CachingDisabled_AlwaysCallsInner()
    {
        _cacheSettings.EnableCaching = false;
        var slides = new List<CarouselSlide> { CreateSlide("s1") }.AsReadOnly();
        _innerRepo.Setup(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(slides);

        var options = Options.Create(_cacheSettings);
        var sut = new CachedCarouselSlidesRepository(_innerRepo.Object, _cache, options, _logger.Object);

        await sut.GetAllSlidesAsync();
        await sut.GetAllSlidesAsync();

        _innerRepo.Verify(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── GetActiveSlidesAsync ─────

    [Fact]
    public async Task GetActiveSlidesAsync_CacheMiss_CallsInnerAndCachesResult()
    {
        var slides = new List<CarouselSlide> { CreateSlide("s1") }.AsReadOnly();
        _innerRepo.Setup(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(slides);

        var result1 = await _sut.GetActiveSlidesAsync();
        var result2 = await _sut.GetActiveSlidesAsync();

        Assert.Single(result1);
        Assert.Single(result2);
        _innerRepo.Verify(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    // ───── GetSlideAsync ─────

    [Fact]
    public async Task GetSlideAsync_CacheMiss_CallsInnerAndCachesResult()
    {
        var slide = CreateSlide("s1");
        _innerRepo.Setup(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(slide);

        var result1 = await _sut.GetSlideAsync("s1");
        var result2 = await _sut.GetSlideAsync("s1");

        Assert.NotNull(result1);
        Assert.Equal("s1", result1.Id);
        Assert.NotNull(result2);
        _innerRepo.Verify(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetSlideAsync_CachingDisabled_AlwaysCallsInner()
    {
        _cacheSettings.EnableCaching = false;
        var slide = CreateSlide("s1");
        _innerRepo.Setup(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(slide);

        var options = Options.Create(_cacheSettings);
        var sut = new CachedCarouselSlidesRepository(_innerRepo.Object, _cache, options, _logger.Object);

        await sut.GetSlideAsync("s1");
        await sut.GetSlideAsync("s1");

        _innerRepo.Verify(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── CreateSlideAsync — invalidation ─────

    [Fact]
    public async Task CreateSlideAsync_InvalidatesAllAndActiveCaches()
    {
        var slide = CreateSlide("s1");
        _innerRepo.Setup(r => r.CreateSlideAsync(slide, It.IsAny<CancellationToken>()))
            .ReturnsAsync(slide);
        _innerRepo.Setup(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CarouselSlide> { slide }.AsReadOnly());
        _innerRepo.Setup(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CarouselSlide> { slide }.AsReadOnly());

        // Populate both caches
        await _sut.GetAllSlidesAsync();
        await _sut.GetActiveSlidesAsync();

        // Create triggers invalidation
        await _sut.CreateSlideAsync(slide);

        // Both should miss cache now
        await _sut.GetAllSlidesAsync();
        await _sut.GetActiveSlidesAsync();

        _innerRepo.Verify(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        _innerRepo.Verify(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── UpdateSlideAsync — invalidation ─────

    [Fact]
    public async Task UpdateSlideAsync_InvalidatesAllActivAndSingleItemCaches()
    {
        var slide = CreateSlide("s1");
        _innerRepo.Setup(r => r.UpdateSlideAsync(slide, It.IsAny<CancellationToken>()))
            .ReturnsAsync(slide);
        _innerRepo.Setup(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CarouselSlide> { slide }.AsReadOnly());
        _innerRepo.Setup(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(slide);

        // Populate caches
        await _sut.GetAllSlidesAsync();
        await _sut.GetSlideAsync("s1");

        // Update triggers invalidation
        await _sut.UpdateSlideAsync(slide);

        // Both should miss cache now
        await _sut.GetAllSlidesAsync();
        await _sut.GetSlideAsync("s1");

        _innerRepo.Verify(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        _innerRepo.Verify(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── DeleteSlideAsync — invalidation ─────

    [Fact]
    public async Task DeleteSlideAsync_InvalidatesAllActiveAndSingleItemCaches()
    {
        var slide = CreateSlide("s1");
        _innerRepo.Setup(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CarouselSlide> { slide }.AsReadOnly());
        _innerRepo.Setup(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CarouselSlide> { slide }.AsReadOnly());
        _innerRepo.Setup(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(slide);

        // Populate all three caches
        await _sut.GetAllSlidesAsync();
        await _sut.GetActiveSlidesAsync();
        await _sut.GetSlideAsync("s1");

        // Delete triggers invalidation
        await _sut.DeleteSlideAsync("s1");

        // All three should miss cache now
        await _sut.GetAllSlidesAsync();
        await _sut.GetActiveSlidesAsync();
        await _sut.GetSlideAsync("s1");

        _innerRepo.Verify(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        _innerRepo.Verify(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        _innerRepo.Verify(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── ReorderSlidesAsync — invalidation ─────

    [Fact]
    public async Task ReorderSlidesAsync_InvalidatesAllAndActiveCaches()
    {
        var slides = new List<CarouselSlide> { CreateSlide("s1"), CreateSlide("s2") }.AsReadOnly();
        var slideIds = new[] { "s2", "s1" };
        _innerRepo.Setup(r => r.ReorderSlidesAsync(slideIds, It.IsAny<CancellationToken>()))
            .ReturnsAsync(slides);
        _innerRepo.Setup(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(slides);
        _innerRepo.Setup(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(slides);

        // Populate caches
        await _sut.GetAllSlidesAsync();
        await _sut.GetActiveSlidesAsync();

        // Reorder triggers invalidation
        await _sut.ReorderSlidesAsync(slideIds);

        // Both should miss cache now
        await _sut.GetAllSlidesAsync();
        await _sut.GetActiveSlidesAsync();

        _innerRepo.Verify(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        _innerRepo.Verify(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── Helper ─────

    private static CarouselSlide CreateSlide(string id)
    {
        return new CarouselSlide
        {
            Id = id,
            ImageUrl = $"https://example.com/{id}.jpg",
            Alt = $"Slide {id}",
            Order = 0,
            IsActive = true
        };
    }
}
