using Application.Repositories;
using Domain.Entities;
using Infrastructure.Configuration;
using Infrastructure.Repositories;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace Api.Tests.Unit.Repositories;

public class CachedProductsRepositoryTests
{
    private readonly Mock<IProductsRepository> _innerRepo;
    private readonly IMemoryCache _cache;
    private readonly CacheSettings _cacheSettings;
    private readonly Mock<ILogger<CachedProductsRepository>> _logger;
    private readonly CachedProductsRepository _sut;

    public CachedProductsRepositoryTests()
    {
        _innerRepo = new Mock<IProductsRepository>();
        _cache = new MemoryCache(new MemoryCacheOptions());
        _cacheSettings = new CacheSettings
        {
            EnableCaching = true,
            ProductsExpirationMinutes = 10,
            SingleItemExpirationMinutes = 5,
            SearchResultsMaxCacheSize = 500
        };
        _logger = new Mock<ILogger<CachedProductsRepository>>();

        var options = Options.Create(_cacheSettings);
        _sut = new CachedProductsRepository(_innerRepo.Object, _cache, options, _logger.Object);
    }

    // ───── GetAllProductsAsync ─────

    [Fact]
    public async Task GetAllProductsAsync_CacheMiss_CallsInnerAndCachesResult()
    {
        var products = new List<Product> { CreateProduct("p1"), CreateProduct("p2") }.AsReadOnly();
        _innerRepo.Setup(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(products);

        var result1 = await _sut.GetAllProductsAsync();
        var result2 = await _sut.GetAllProductsAsync();

        Assert.Equal(2, result1.Count);
        Assert.Equal(2, result2.Count);
        _innerRepo.Verify(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetAllProductsAsync_CachingDisabled_AlwaysCallsInner()
    {
        _cacheSettings.EnableCaching = false;
        var products = new List<Product> { CreateProduct("p1") }.AsReadOnly();
        _innerRepo.Setup(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(products);

        var options = Options.Create(_cacheSettings);
        var sut = new CachedProductsRepository(_innerRepo.Object, _cache, options, _logger.Object);

        await sut.GetAllProductsAsync();
        await sut.GetAllProductsAsync();

        _innerRepo.Verify(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── GetProductsBySellerAsync ─────

    [Fact]
    public async Task GetProductsBySellerAsync_CacheMiss_CallsInnerAndCachesResult()
    {
        var products = new List<Product> { CreateProduct("p1") }.AsReadOnly();
        _innerRepo.Setup(r => r.GetProductsBySellerAsync("seller-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(products);

        var result1 = await _sut.GetProductsBySellerAsync("seller-1");
        var result2 = await _sut.GetProductsBySellerAsync("seller-1");

        Assert.Single(result1);
        Assert.Single(result2);
        _innerRepo.Verify(r => r.GetProductsBySellerAsync("seller-1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetProductsBySellerAsync_DifferentSellers_CachesSeparately()
    {
        _innerRepo.Setup(r => r.GetProductsBySellerAsync("seller-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Product> { CreateProduct("p1") }.AsReadOnly());
        _innerRepo.Setup(r => r.GetProductsBySellerAsync("seller-2", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Product> { CreateProduct("p2"), CreateProduct("p3") }.AsReadOnly());

        var result1 = await _sut.GetProductsBySellerAsync("seller-1");
        var result2 = await _sut.GetProductsBySellerAsync("seller-2");

        Assert.Single(result1);
        Assert.Equal(2, result2.Count);
    }

    // ───── GetProductAsync ─────

    [Fact]
    public async Task GetProductAsync_CacheMiss_CallsInnerAndCachesResult()
    {
        var product = CreateProduct("p1");
        _innerRepo.Setup(r => r.GetProductAsync("p1", "seller-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var result1 = await _sut.GetProductAsync("p1", "seller-1");
        var result2 = await _sut.GetProductAsync("p1", "seller-1");

        Assert.NotNull(result1);
        Assert.Equal("p1", result1.Id);
        Assert.NotNull(result2);
        _innerRepo.Verify(r => r.GetProductAsync("p1", "seller-1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetProductAsync_CachingDisabled_AlwaysCallsInner()
    {
        _cacheSettings.EnableCaching = false;
        var product = CreateProduct("p1");
        _innerRepo.Setup(r => r.GetProductAsync("p1", "seller-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var options = Options.Create(_cacheSettings);
        var sut = new CachedProductsRepository(_innerRepo.Object, _cache, options, _logger.Object);

        await sut.GetProductAsync("p1", "seller-1");
        await sut.GetProductAsync("p1", "seller-1");

        _innerRepo.Verify(r => r.GetProductAsync("p1", "seller-1", It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── GetProductBySlugAsync ─────

    [Fact]
    public async Task GetProductBySlugAsync_CacheMiss_CallsInnerAndCachesResult()
    {
        var product = CreateProduct("p1", slug: "my-product");
        _innerRepo.Setup(r => r.GetProductBySlugAsync("my-product", It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        var result1 = await _sut.GetProductBySlugAsync("my-product");
        var result2 = await _sut.GetProductBySlugAsync("my-product");

        Assert.NotNull(result1);
        Assert.Equal("my-product", result1.Slug);
        _innerRepo.Verify(r => r.GetProductBySlugAsync("my-product", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ───── GetFeaturedProductsAsync ─────

    [Fact]
    public async Task GetFeaturedProductsAsync_CacheMiss_CallsInnerAndCachesResult()
    {
        var products = new List<Product> { CreateProduct("p1", featured: true) }.AsReadOnly();
        _innerRepo.Setup(r => r.GetFeaturedProductsAsync(null, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(products);

        var result1 = await _sut.GetFeaturedProductsAsync();
        var result2 = await _sut.GetFeaturedProductsAsync();

        Assert.Single(result1);
        _innerRepo.Verify(r => r.GetFeaturedProductsAsync(null, 20, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetFeaturedProductsAsync_DifferentCategories_CachesSeparately()
    {
        _innerRepo.Setup(r => r.GetFeaturedProductsAsync(null, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Product> { CreateProduct("p1") }.AsReadOnly());
        _innerRepo.Setup(r => r.GetFeaturedProductsAsync("cat-1", 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Product> { CreateProduct("p2"), CreateProduct("p3") }.AsReadOnly());

        var allFeatured = await _sut.GetFeaturedProductsAsync();
        var catFeatured = await _sut.GetFeaturedProductsAsync("cat-1");

        Assert.Single(allFeatured);
        Assert.Equal(2, catFeatured.Count);
    }

    // ───── GetProductsAsync (search caching) ─────

    [Fact]
    public async Task GetProductsAsync_WithSearchTerm_CachesResults()
    {
        var products = new List<Product> { CreateProduct("p1"), CreateProduct("p2") }.AsReadOnly();
        var response = new PaginatedResponse<Product>(products, 2, 1, 500);
        _innerRepo.Setup(r => r.GetProductsAsync(It.IsAny<ProductQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        var parameters = new ProductQueryParameters { SearchTerm = "test", Page = 1, PageSize = 10 };

        var result1 = await _sut.GetProductsAsync(parameters);
        var result2 = await _sut.GetProductsAsync(parameters);

        Assert.Equal(2, result1.TotalCount);
        _innerRepo.Verify(r => r.GetProductsAsync(It.IsAny<ProductQueryParameters>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetProductsAsync_WithoutSearchTerm_DoesNotCache()
    {
        var products = new List<Product> { CreateProduct("p1") }.AsReadOnly();
        var response = new PaginatedResponse<Product>(products, 1, 1, 10);
        _innerRepo.Setup(r => r.GetProductsAsync(It.IsAny<ProductQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        var parameters = new ProductQueryParameters { Page = 1, PageSize = 10 };

        await _sut.GetProductsAsync(parameters);
        await _sut.GetProductsAsync(parameters);

        _innerRepo.Verify(r => r.GetProductsAsync(It.IsAny<ProductQueryParameters>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task GetProductsAsync_SearchPaginatesInMemory()
    {
        var products = Enumerable.Range(1, 5)
            .Select(i => CreateProduct($"p{i}"))
            .ToList()
            .AsReadOnly();
        var response = new PaginatedResponse<Product>(products, 5, 1, 500);
        _innerRepo.Setup(r => r.GetProductsAsync(It.IsAny<ProductQueryParameters>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(response);

        var page1 = await _sut.GetProductsAsync(new ProductQueryParameters { SearchTerm = "test", Page = 1, PageSize = 2 });
        var page2 = await _sut.GetProductsAsync(new ProductQueryParameters { SearchTerm = "test", Page = 2, PageSize = 2 });

        Assert.Equal(2, page1.Items.Count);
        Assert.Equal(2, page2.Items.Count);
        Assert.Equal(5, page1.TotalCount);
        _innerRepo.Verify(r => r.GetProductsAsync(It.IsAny<ProductQueryParameters>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    // ───── CreateProductAsync — invalidation ─────

    [Fact]
    public async Task CreateProductAsync_InvalidatesRelatedCaches()
    {
        var product = CreateProduct("p1");
        _innerRepo.Setup(r => r.CreateProductAsync(product, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);
        _innerRepo.Setup(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Product> { product }.AsReadOnly());

        // Populate cache
        await _sut.GetAllProductsAsync();
        _innerRepo.Verify(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()), Times.Once);

        // Create triggers invalidation
        await _sut.CreateProductAsync(product);

        // Next read should miss cache
        await _sut.GetAllProductsAsync();
        _innerRepo.Verify(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── UpdateProductAsync — invalidation ─────

    [Fact]
    public async Task UpdateProductAsync_InvalidatesRelatedCaches()
    {
        var product = CreateProduct("p1");
        _innerRepo.Setup(r => r.UpdateProductAsync(product, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);
        _innerRepo.Setup(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Product> { product }.AsReadOnly());

        // Populate cache
        await _sut.GetAllProductsAsync();

        // Update triggers invalidation
        await _sut.UpdateProductAsync(product);

        // Next read should miss cache
        await _sut.GetAllProductsAsync();
        _innerRepo.Verify(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── DeleteProductAsync — invalidation ─────

    [Fact]
    public async Task DeleteProductAsync_InvalidatesRelatedCaches()
    {
        var product = CreateProduct("p1");
        _innerRepo.Setup(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Product> { product }.AsReadOnly());

        // Populate cache
        await _sut.GetAllProductsAsync();

        // Delete triggers invalidation
        await _sut.DeleteProductAsync("p1", "seller-1");

        // Next read should miss cache
        await _sut.GetAllProductsAsync();
        _innerRepo.Verify(r => r.GetAllProductsAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task DeleteProductAsync_InvalidatesFeaturedCaches()
    {
        var products = new List<Product> { CreateProduct("p1", featured: true) }.AsReadOnly();
        _innerRepo.Setup(r => r.GetFeaturedProductsAsync(null, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(products);

        // Populate featured cache
        await _sut.GetFeaturedProductsAsync();
        _innerRepo.Verify(r => r.GetFeaturedProductsAsync(null, 20, It.IsAny<CancellationToken>()), Times.Once);

        // Delete triggers featured cache invalidation
        await _sut.DeleteProductAsync("p1", "seller-1");

        // Next featured read should miss cache
        await _sut.GetFeaturedProductsAsync();
        _innerRepo.Verify(r => r.GetFeaturedProductsAsync(null, 20, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    // ───── Helper ─────

    private static Product CreateProduct(string id, string slug = "test-product", bool featured = false)
    {
        return new Product
        {
            Id = id,
            Name = $"Product {id}",
            Price = 19.99m,
            SellerId = "seller-1",
            Slug = slug,
            Stock = 50,
            Featured = featured,
            Seller = new Seller { Id = "seller-1", DisplayName = "Test Seller" },
            ImageUrls = ["https://example.com/img.jpg"]
        };
    }
}
