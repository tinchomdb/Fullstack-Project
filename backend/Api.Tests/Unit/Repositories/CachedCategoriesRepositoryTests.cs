using Application.Repositories;
using Domain.Entities;
using Infrastructure.Configuration;
using Infrastructure.Repositories;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace Api.Tests.Unit.Repositories;

public class CachedCategoriesRepositoryTests
{
    private readonly Mock<ICategoriesRepository> _innerRepo;
    private readonly IMemoryCache _cache;
    private readonly CacheSettings _cacheSettings;
    private readonly Mock<ILogger<CachedCategoriesRepository>> _logger;
    private readonly CachedCategoriesRepository _sut;

    public CachedCategoriesRepositoryTests()
    {
        _innerRepo = new Mock<ICategoriesRepository>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _cacheSettings = new CacheSettings
        {
            EnableCaching = true,
            CategoriesExpirationMinutes = 10,
            SingleItemExpirationMinutes = 5
        };
        _logger = new Mock<ILogger<CachedCategoriesRepository>>();

        var options = Options.Create(_cacheSettings);
        _sut = new CachedCategoriesRepository(_innerRepo.Object, _cache, options, _logger.Object);
    }

    // ───── GetCategoriesAsync ─────

    [Fact]
    public async Task GetCategoriesAsync_CacheMiss_CallsInnerAndCachesResult()
    {
        var categories = new List<Category> { CreateCategory("c1"), CreateCategory("c2") }.AsReadOnly();
        _innerRepo.Setup(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(categories);

        var result1 = await _sut.GetCategoriesAsync();
        var result2 = await _sut.GetCategoriesAsync();

        Assert.Equal(2, result1.Count);
        Assert.Equal(2, result2.Count);
        _innerRepo.Verify(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetCategoriesAsync_CachingDisabled_AlwaysCallsInner()
    {
        _cacheSettings.EnableCaching = false;
        var categories = new List<Category> { CreateCategory("c1") }.AsReadOnly();
        _innerRepo.Setup(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(categories);

        var options = Options.Create(_cacheSettings);
        var sut = new CachedCategoriesRepository(_innerRepo.Object, _cache, options, _logger.Object);

        await sut.GetCategoriesAsync();
        await sut.GetCategoriesAsync();

        _innerRepo.Verify(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── GetCategoryAsync ─────

    [Fact]
    public async Task GetCategoryAsync_CacheMiss_CallsInnerAndCachesResult()
    {
        var category = CreateCategory("c1");
        _innerRepo.Setup(r => r.GetCategoryAsync("c1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        var result1 = await _sut.GetCategoryAsync("c1");
        var result2 = await _sut.GetCategoryAsync("c1");

        Assert.NotNull(result1);
        Assert.Equal("c1", result1.Id);
        Assert.NotNull(result2);
        _innerRepo.Verify(r => r.GetCategoryAsync("c1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetCategoryAsync_DifferentIds_CachesSeparately()
    {
        _innerRepo.Setup(r => r.GetCategoryAsync("c1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateCategory("c1"));
        _innerRepo.Setup(r => r.GetCategoryAsync("c2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateCategory("c2"));

        var result1 = await _sut.GetCategoryAsync("c1");
        var result2 = await _sut.GetCategoryAsync("c2");

        Assert.Equal("c1", result1!.Id);
        Assert.Equal("c2", result2!.Id);
        _innerRepo.Verify(r => r.GetCategoryAsync("c1", It.IsAny<CancellationToken>()), Times.Once);
        _innerRepo.Verify(r => r.GetCategoryAsync("c2", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ───── CreateCategoryAsync — invalidation ─────

    [Fact]
    public async Task CreateCategoryAsync_InvalidatesAllCategoriesCache()
    {
        var category = CreateCategory("c1");
        _innerRepo.Setup(r => r.CreateCategoryAsync(category, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);
        _innerRepo.Setup(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Category> { category }.AsReadOnly());

        // Populate cache
        await _sut.GetCategoriesAsync();
        _innerRepo.Verify(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()), Times.Once);

        // Create triggers invalidation
        await _sut.CreateCategoryAsync(category);

        // Next read should miss cache
        await _sut.GetCategoriesAsync();
        _innerRepo.Verify(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── UpdateCategoryAsync — invalidation ─────

    [Fact]
    public async Task UpdateCategoryAsync_InvalidatesAllCategoriesAndSingleItemCache()
    {
        var category = CreateCategory("c1");
        _innerRepo.Setup(r => r.UpdateCategoryAsync(category, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);
        _innerRepo.Setup(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Category> { category }.AsReadOnly());
        _innerRepo.Setup(r => r.GetCategoryAsync("c1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        // Populate both caches
        await _sut.GetCategoriesAsync();
        await _sut.GetCategoryAsync("c1");

        // Update triggers invalidation
        await _sut.UpdateCategoryAsync(category);

        // Both should miss cache now
        await _sut.GetCategoriesAsync();
        await _sut.GetCategoryAsync("c1");

        _innerRepo.Verify(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        _innerRepo.Verify(r => r.GetCategoryAsync("c1", It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── DeleteCategoryAsync — invalidation ─────

    [Fact]
    public async Task DeleteCategoryAsync_InvalidatesAllCategoriesAndSingleItemCache()
    {
        var category = CreateCategory("c1");
        _innerRepo.Setup(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Category> { category }.AsReadOnly());
        _innerRepo.Setup(r => r.GetCategoryAsync("c1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        // Populate both caches
        await _sut.GetCategoriesAsync();
        await _sut.GetCategoryAsync("c1");

        // Delete triggers invalidation
        await _sut.DeleteCategoryAsync("c1");

        // Both should miss cache now
        await _sut.GetCategoriesAsync();
        await _sut.GetCategoryAsync("c1");

        _innerRepo.Verify(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
        _innerRepo.Verify(r => r.GetCategoryAsync("c1", It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── Pass-through methods (no caching) ─────

    [Fact]
    public async Task GetAllDescendantCategoryIdsAsync_DelegatesToInner()
    {
        var ids = new List<string> { "c2", "c3" }.AsReadOnly();
        _innerRepo.Setup(r => r.GetAllDescendantCategoryIdsAsync("c1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(ids);

        var result = await _sut.GetAllDescendantCategoryIdsAsync("c1");

        Assert.Equal(2, result.Count);
        _innerRepo.Verify(r => r.GetAllDescendantCategoryIdsAsync("c1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetChildrenCategoriesAsync_DelegatesToInner()
    {
        var children = new List<Category> { CreateCategory("c2") }.AsReadOnly();
        _innerRepo.Setup(r => r.GetChildrenCategoriesAsync("c1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(children);

        var result = await _sut.GetChildrenCategoriesAsync("c1");

        Assert.Single(result);
        _innerRepo.Verify(r => r.GetChildrenCategoriesAsync("c1", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ───── Helper ─────

    private static Category CreateCategory(string id)
    {
        return new Category
        {
            Id = id,
            Name = $"Category {id}",
            Slug = $"category-{id}"
        };
    }
}
