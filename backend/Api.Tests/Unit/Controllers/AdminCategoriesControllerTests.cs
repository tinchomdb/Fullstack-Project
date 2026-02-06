using Api.Controllers;
using Api.DTOs;
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
        var request = new CreateCategoryRequest { Name = "Electronics", Slug = "electronics" };
        _mockRepository
            .Setup(r => r.CreateCategoryAsync(It.IsAny<Category>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Category { Id = "cat-1", Name = "Electronics", Slug = "electronics" });

        // Act
        var result = await _controller.CreateCategory(request, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(201, createdResult.StatusCode);
        var returned = Assert.IsType<Category>(createdResult.Value);
        Assert.Equal("cat-1", returned.Id);
    }

    [Fact]
    public async Task CreateCategory_MapsRequestFieldsToEntity()
    {
        // Arrange
        var request = new CreateCategoryRequest
        {
            Name = "Electronics",
            Slug = "electronics",
            Description = "All electronics",
            Image = "https://example.com/img.png",
            Featured = true,
            ParentCategoryId = "parent-1"
        };

        Category? capturedCategory = null;
        _mockRepository
            .Setup(r => r.CreateCategoryAsync(It.IsAny<Category>(), It.IsAny<CancellationToken>()))
            .Callback<Category, CancellationToken>((c, _) => capturedCategory = c)
            .ReturnsAsync(new Category { Id = "cat-1" });

        // Act
        await _controller.CreateCategory(request, CancellationToken.None);

        // Assert
        Assert.NotNull(capturedCategory);
        Assert.Equal("Electronics", capturedCategory.Name);
        Assert.Equal("electronics", capturedCategory.Slug);
        Assert.Equal("All electronics", capturedCategory.Description);
        Assert.Equal("https://example.com/img.png", capturedCategory.Image);
        Assert.True(capturedCategory.Featured);
        Assert.Equal("parent-1", capturedCategory.ParentCategoryId);
    }

    // ===== UpdateCategory =====

    [Fact]
    public async Task UpdateCategory_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new UpdateCategoryRequest { Name = "Updated Name", Slug = "updated" };
        _mockRepository
            .Setup(r => r.UpdateCategoryAsync(It.IsAny<Category>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Category { Id = "cat-1", Name = "Updated Name" });

        // Act
        var result = await _controller.UpdateCategory("cat-1", request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<Category>(okResult.Value);
        Assert.Equal("Updated Name", returned.Name);
    }

    [Fact]
    public async Task UpdateCategory_SetsIdFromRouteParameter()
    {
        // Arrange
        var request = new UpdateCategoryRequest { Name = "Test", Slug = "test" };

        Category? capturedCategory = null;
        _mockRepository
            .Setup(r => r.UpdateCategoryAsync(It.IsAny<Category>(), It.IsAny<CancellationToken>()))
            .Callback<Category, CancellationToken>((c, _) => capturedCategory = c)
            .ReturnsAsync(new Category { Id = "cat-1" });

        // Act
        await _controller.UpdateCategory("cat-1", request, CancellationToken.None);

        // Assert
        Assert.NotNull(capturedCategory);
        Assert.Equal("cat-1", capturedCategory.Id);
    }

    [Fact]
    public async Task UpdateCategory_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        var request = new UpdateCategoryRequest { Name = "Test", Slug = "test" };
        _mockRepository
            .Setup(r => r.UpdateCategoryAsync(It.IsAny<Category>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Category?)null);

        // Act
        var result = await _controller.UpdateCategory("missing", request, CancellationToken.None);

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
