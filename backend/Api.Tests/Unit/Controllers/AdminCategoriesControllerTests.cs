using Api.Controllers;
using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Api.Tests.Unit.Controllers;

public class AdminCategoriesControllerTests
{
    private readonly Mock<ICategoriesRepository> _mockRepository;
    private readonly AdminCategoriesController _controller;

    public AdminCategoriesControllerTests()
    {
        _mockRepository = new Mock<ICategoriesRepository>();
        _controller = new AdminCategoriesController(_mockRepository.Object);
    }

    [Fact]
    public void Constructor_WithNullRepository_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new AdminCategoriesController(null!));
    }

    // ===== CreateCategory =====

    [Fact]
    public async Task CreateCategory_ReturnsCreatedAtAction()
    {
        // Arrange
        var category = new Category { Id = "cat-1", Name = "Electronics", Slug = "electronics" };
        _mockRepository
            .Setup(r => r.CreateCategoryAsync(category, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        // Act
        var result = await _controller.CreateCategory(category, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(201, createdResult.StatusCode);
        var returned = Assert.IsType<Category>(createdResult.Value);
        Assert.Equal("cat-1", returned.Id);
    }

    // ===== UpdateCategory =====

    [Fact]
    public async Task UpdateCategory_WithMatchingId_ReturnsOk()
    {
        // Arrange
        var category = new Category { Id = "cat-1", Name = "Updated Name" };
        _mockRepository
            .Setup(r => r.UpdateCategoryAsync(category, It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        // Act
        var result = await _controller.UpdateCategory("cat-1", category, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<Category>(okResult.Value);
        Assert.Equal("Updated Name", returned.Name);
    }

    [Fact]
    public async Task UpdateCategory_WithMismatchedId_ReturnsBadRequest()
    {
        // Arrange
        var category = new Category { Id = "cat-1" };

        // Act
        var result = await _controller.UpdateCategory("different-id", category, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task UpdateCategory_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        var category = new Category { Id = "missing" };
        _mockRepository
            .Setup(r => r.UpdateCategoryAsync(category, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Category?)null);

        // Act
        var result = await _controller.UpdateCategory("missing", category, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    // ===== DeleteCategory =====

    [Fact]
    public async Task DeleteCategory_WhenExists_ReturnsNoContent()
    {
        // Arrange
        var category = new Category { Id = "cat-1" };
        _mockRepository
            .Setup(r => r.GetCategoryAsync("cat-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(category);

        // Act
        var result = await _controller.DeleteCategory("cat-1", CancellationToken.None);

        // Assert
        Assert.IsType<NoContentResult>(result);
        _mockRepository.Verify(r => r.DeleteCategoryAsync("cat-1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteCategory_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetCategoryAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((Category?)null);

        // Act
        var result = await _controller.DeleteCategory("missing", CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result);
        _mockRepository.Verify(r => r.DeleteCategoryAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
