using Api.Controllers;
using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Api.Tests.Unit.Controllers;

public class ProductsControllerTests
{
    private readonly Mock<IProductsRepository> _mockRepository;
    private readonly ProductsController _controller;

    public ProductsControllerTests()
    {
        _mockRepository = new Mock<IProductsRepository>();
        _controller = new ProductsController(_mockRepository.Object);
    }

    [Fact]
    public async Task GetAllProducts_ReturnsOkResult()
    {
        // Arrange
        var parameters = new ProductQueryParameters { Page = 1, PageSize = 10 };
        var products = new List<Product>
        {
            new() { Id = "1", Name = "Laptop", Price = 999.99m, SellerId = "seller1" },
            new() { Id = "2", Name = "Mouse", Price = 29.99m, SellerId = "seller1" }
        };
        var paginatedResponse = new PaginatedResponse<Product>(products, 2, 1, 10);

        _mockRepository
            .Setup(r => r.GetProductsAsync(parameters, It.IsAny<CancellationToken>()))
            .ReturnsAsync(paginatedResponse);

        // Act
        var result = await _controller.GetAllProducts(parameters, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<ActionResult<PaginatedResponse<Product>>>(result);
        var returnValue = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedResponse = Assert.IsType<PaginatedResponse<Product>>(returnValue.Value);
        Assert.Equal(2, returnedResponse.TotalCount);
        Assert.Equal(2, returnedResponse.Items.Count);
    }

    [Fact]
    public async Task GetAllProducts_WithPageExceedingTotal_ReturnsBadRequest()
    {
        // Arrange
        var parameters = new ProductQueryParameters { Page = 5, PageSize = 10 };
        // TotalCount = 10, so TotalPages = 1, but Page = 5, which exceeds TotalPages
        var emptyResponse = new PaginatedResponse<Product>(new List<Product>(), 10, 5, 10);

        _mockRepository
            .Setup(r => r.GetProductsAsync(parameters, It.IsAny<CancellationToken>()))
            .ReturnsAsync(emptyResponse);

        // Act
        var result = await _controller.GetAllProducts(parameters, CancellationToken.None);

        // Assert
        var actionResult = Assert.IsType<ActionResult<PaginatedResponse<Product>>>(result);
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(actionResult.Result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task GetProduct_WithValidIds_ReturnsProduct()
    {
        // Arrange
        var productId = "product1";
        var sellerId = "seller1";
        var expectedProduct = new Product
        {
            Id = productId,
            Name = "Laptop",
            Price = 999.99m,
            SellerId = sellerId
        };

        _mockRepository
            .Setup(r => r.GetProductAsync(productId, sellerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedProduct);

        // Act
        var result = await _controller.GetProduct(productId, sellerId, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<ActionResult<Product>>(result);
        var returnValue = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedProduct = Assert.IsType<Product>(returnValue.Value);
        Assert.Equal(productId, returnedProduct.Id);
        Assert.Equal("Laptop", returnedProduct.Name);
    }

    [Fact]
    public async Task GetProduct_WithInvalidIds_ReturnsNotFound()
    {
        // Arrange
        var productId = "nonexistent";
        var sellerId = "seller1";

        _mockRepository
            .Setup(r => r.GetProductAsync(productId, sellerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        // Act
        var result = await _controller.GetProduct(productId, sellerId, CancellationToken.None);

        // Assert
        var actionResult = Assert.IsType<ActionResult<Product>>(result);
        Assert.IsType<NotFoundResult>(actionResult.Result);
    }

    [Fact]
    public async Task GetProductBySlug_WithValidSlug_ReturnsProduct()
    {
        // Arrange
        var slug = "laptop-hp-spectre";
        var expectedProduct = new Product
        {
            Id = "product1",
            Name = "Laptop HP Spectre",
            Price = 999.99m,
            Slug = slug,
            SellerId = "seller1"
        };

        _mockRepository
            .Setup(r => r.GetProductBySlugAsync(slug, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedProduct);

        // Act
        var result = await _controller.GetProductBySlug(slug, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<ActionResult<Product>>(result);
        var returnValue = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedProduct = Assert.IsType<Product>(returnValue.Value);
        Assert.Equal(slug, returnedProduct.Slug);
    }

    [Fact]
    public async Task GetProductBySlug_WithInvalidSlug_ReturnsNotFound()
    {
        // Arrange
        var slug = "nonexistent-product";

        _mockRepository
            .Setup(r => r.GetProductBySlugAsync(slug, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        // Act
        var result = await _controller.GetProductBySlug(slug, CancellationToken.None);

        // Assert
        var actionResult = Assert.IsType<ActionResult<Product>>(result);
        Assert.IsType<NotFoundResult>(actionResult.Result);
    }

    [Fact]
    public async Task GetProductsBySeller_ReturnsSellerProducts()
    {
        // Arrange
        var sellerId = "seller1";
        var products = new List<Product>
        {
            new() { Id = "1", Name = "Laptop", Price = 999.99m, SellerId = sellerId },
            new() { Id = "2", Name = "Mouse", Price = 29.99m, SellerId = sellerId }
        };

        _mockRepository
            .Setup(r => r.GetProductsBySellerAsync(sellerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(products);

        // Act
        var result = await _controller.GetProductsBySeller(sellerId, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<ActionResult<IReadOnlyList<Product>>>(result);
        var returnValue = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedProducts = Assert.IsAssignableFrom<IReadOnlyList<Product>>(returnValue.Value);
        Assert.Equal(2, returnedProducts.Count);
        Assert.All(returnedProducts, p => Assert.Equal(sellerId, p.SellerId));
    }

    [Fact]
    public void Constructor_WithNullRepository_ThrowsArgumentNullException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new ProductsController(null!));
    }

    [Fact]
    public async Task GetFeaturedProducts_ReturnsOkWithProducts()
    {
        // Arrange
        var products = new List<Product>
        {
            new() { Id = "1", Name = "Featured Laptop", Price = 999.99m, SellerId = "seller1", Featured = true }
        };
        _mockRepository
            .Setup(r => r.GetFeaturedProductsAsync(null, 20, It.IsAny<CancellationToken>()))
            .ReturnsAsync(products);

        // Act
        var result = await _controller.GetFeaturedProducts(cancellationToken: CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<ActionResult<IReadOnlyList<Product>>>(result);
        var returnValue = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedProducts = Assert.IsAssignableFrom<IReadOnlyList<Product>>(returnValue.Value);
        Assert.Single(returnedProducts);
        Assert.True(returnedProducts[0].Featured);
    }

    [Fact]
    public async Task GetFeaturedProducts_WithCategoryFilter_PassesCategoryId()
    {
        // Arrange
        var products = new List<Product>();
        _mockRepository
            .Setup(r => r.GetFeaturedProductsAsync("electronics", 10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(products);

        // Act
        var result = await _controller.GetFeaturedProducts(limit: 10, categoryId: "electronics", cancellationToken: CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<ActionResult<IReadOnlyList<Product>>>(result);
        Assert.IsType<OkObjectResult>(okResult.Result);
        _mockRepository.Verify(r => r.GetFeaturedProductsAsync("electronics", 10, It.IsAny<CancellationToken>()), Times.Once);
    }
}
