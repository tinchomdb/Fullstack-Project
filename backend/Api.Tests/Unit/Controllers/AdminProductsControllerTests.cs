using Api.Controllers;
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
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1");
        _mockRepository
            .Setup(r => r.CreateProductAsync(product, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        // Act
        var result = await _controller.CreateProduct(product, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(201, createdResult.StatusCode);
        var returned = Assert.IsType<Product>(createdResult.Value);
        Assert.Equal("p1", returned.Id);
    }

    // ===== UpdateProduct =====

    [Fact]
    public async Task UpdateProduct_WithMatchingIds_ReturnsOk()
    {
        // Arrange
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1", name: "Updated");
        _mockRepository
            .Setup(r => r.UpdateProductAsync(product, It.IsAny<CancellationToken>()))
            .ReturnsAsync(product);

        // Act
        var result = await _controller.UpdateProduct("p1", "s1", product, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<Product>(okResult.Value);
        Assert.Equal("Updated", returned.Name);
    }

    [Fact]
    public async Task UpdateProduct_WithMismatchedProductId_ReturnsBadRequest()
    {
        // Arrange
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1");

        // Act
        var result = await _controller.UpdateProduct("wrong-id", "s1", product, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateProduct_WithMismatchedSellerId_ReturnsBadRequest()
    {
        // Arrange
        var product = TestDataBuilder.CreateProduct(id: "p1", sellerId: "s1");

        // Act
        var result = await _controller.UpdateProduct("p1", "wrong-seller", product, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
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
