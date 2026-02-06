using Api.Controllers;
using Api.DTOs;
using Api.Tests.Helpers;
using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Api.Tests.Unit.Controllers;

public class AdminProductsControllerTests
{
    private readonly Mock<IProductsRepository> _mockRepository;
    private readonly AdminProductsController _controller;

    public AdminProductsControllerTests()
    {
        _mockRepository = new Mock<IProductsRepository>();
        _controller = new AdminProductsController(_mockRepository.Object);
    }

    [Fact]
    public void Constructor_WithNullRepository_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new AdminProductsController(null!));
    }

    // ===== CreateProduct =====

    [Fact]
    public async Task CreateProduct_ReturnsCreatedAtAction()
    {
        // Arrange
        var request = new CreateProductRequest
        {
            Name = "Test Product",
            Description = "A test product",
            Slug = "test-product",
            Price = 29.99m,
            Stock = 100,
            SellerId = "s1"
        };
        var createdProduct = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1");
        _mockRepository
            .Setup(r => r.CreateProductAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdProduct);

        // Act
        var result = await _controller.CreateProduct(request, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(201, createdResult.StatusCode);
        var returned = Assert.IsType<Product>(createdResult.Value);
        Assert.Equal("p1", returned.Id);
    }

    [Fact]
    public async Task CreateProduct_MapsRequestFieldsToEntity()
    {
        // Arrange
        var request = new CreateProductRequest
        {
            Name = "New Product",
            Description = "Description",
            Slug = "new-product",
            Price = 49.99m,
            Currency = "EUR",
            Stock = 50,
            SellerId = "s1",
            CategoryIds = ["cat-1", "cat-2"],
            Featured = true
        };

        Product? capturedProduct = null;
        _mockRepository
            .Setup(r => r.CreateProductAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .Callback<Product, CancellationToken>((p, _) => capturedProduct = p)
            .ReturnsAsync(TestDataBuilder.CreateProduct());

        // Act
        await _controller.CreateProduct(request, CancellationToken.None);

        // Assert
        Assert.NotNull(capturedProduct);
        Assert.Equal("New Product", capturedProduct.Name);
        Assert.Equal("new-product", capturedProduct.Slug);
        Assert.Equal(49.99m, capturedProduct.Price);
        Assert.Equal("EUR", capturedProduct.Currency);
        Assert.Equal(50, capturedProduct.Stock);
        Assert.Equal("s1", capturedProduct.SellerId);
        Assert.Equal(2, capturedProduct.CategoryIds.Count);
        Assert.True(capturedProduct.Featured);
    }

    // ===== UpdateProduct =====

    [Fact]
    public async Task UpdateProduct_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new UpdateProductRequest
        {
            Name = "Updated",
            Description = "Updated desc",
            Slug = "updated",
            Price = 39.99m,
            Stock = 50
        };
        var updatedProduct = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", name: "Updated");
        _mockRepository
            .Setup(r => r.UpdateProductAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedProduct);

        // Act
        var result = await _controller.UpdateProduct("p1", "s1", request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<Product>(okResult.Value);
        Assert.Equal("Updated", returned.Name);
    }

    [Fact]
    public async Task UpdateProduct_SetsIdAndSellerIdFromRouteParameters()
    {
        // Arrange
        var request = new UpdateProductRequest
        {
            Name = "Test",
            Description = "Desc",
            Slug = "test",
            Price = 10m,
            Stock = 5
        };

        Product? capturedProduct = null;
        _mockRepository
            .Setup(r => r.UpdateProductAsync(It.IsAny<Product>(), It.IsAny<CancellationToken>()))
            .Callback<Product, CancellationToken>((p, _) => capturedProduct = p)
            .ReturnsAsync(TestDataBuilder.CreateProduct());

        // Act
        await _controller.UpdateProduct("p1", "s1", request, CancellationToken.None);

        // Assert
        Assert.NotNull(capturedProduct);
        Assert.Equal("p1", capturedProduct.Id);
        Assert.Equal("s1", capturedProduct.SellerId);
    }

    // ===== DeleteProduct =====

    [Fact]
    public async Task DeleteProduct_ReturnsNoContent()
    {
        // Act
        var result = await _controller.DeleteProduct("p1", "s1", CancellationToken.None);

        // Assert
        Assert.IsType<NoContentResult>(result);
        _mockRepository.Verify(
            r => r.DeleteProductAsync("p1", "s1", It.IsAny<CancellationToken>()), Times.Once);
    }
}
