using Api.Controllers;
using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Api.Tests.Unit.Controllers;

public class CategoriesControllerTests
{
    private readonly Mock<ICategoriesRepository> _mockRepository;
    private readonly CategoriesController _controller;

    public CategoriesControllerTests()
    {
        _mockRepository = new Mock<ICategoriesRepository>();
        _controller = new CategoriesController(_mockRepository.Object);
    }

    [Fact]
    public async Task GetCategories_ReturnsOkResult()
    {
        // Arrange
        var categories = new List<Category>
        {
            new() { Id = "1", Name = "Electronics", Slug = "electronics" },
            new() { Id = "2", Name = "Books", Slug = "books" }
        };
        _mockRepository
            .Setup(r => r.GetCategoriesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(categories);

        // Act
        var result = await _controller.GetCategories(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<ActionResult<IReadOnlyList<Category>>>(result);
        var returnValue = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedCategories = Assert.IsAssignableFrom<IReadOnlyList<Category>>(returnValue.Value);
        Assert.Equal(2, returnedCategories.Count);
    }

    [Fact]
    public async Task GetCategory_WithValidId_ReturnsCategory()
    {
        // Arrange
        var categoryId = "electronics";
        var expectedCategory = new Category 
        { 
            Id = categoryId, 
            Name = "Electronics", 
            Slug = "electronics" 
        };
        _mockRepository
            .Setup(r => r.GetCategoryAsync(categoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedCategory);

        // Act
        var result = await _controller.GetCategory(categoryId, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<ActionResult<Category>>(result);
        var returnValue = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedCategory = Assert.IsType<Category>(returnValue.Value);
        Assert.Equal(categoryId, returnedCategory.Id);
        Assert.Equal("Electronics", returnedCategory.Name);
    }

    [Fact]
    public async Task GetCategory_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var categoryId = "nonexistent";
        _mockRepository
            .Setup(r => r.GetCategoryAsync(categoryId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Category?)null);

        // Act
        var result = await _controller.GetCategory(categoryId, CancellationToken.None);

        // Assert
        var actionResult = Assert.IsType<ActionResult<Category>>(result);
        Assert.IsType<NotFoundResult>(actionResult.Result);
    }

    [Fact]
    public async Task GetCategoriesByParent_WithNullParentId_ReturnsRootCategories()
    {
        // Arrange
        var rootCategories = new List<Category>
        {
            new() { Id = "1", Name = "Electronics", Slug = "electronics", ParentCategoryId = null },
            new() { Id = "2", Name = "Books", Slug = "books", ParentCategoryId = null }
        };
        _mockRepository
            .Setup(r => r.GetChildrenCategoriesAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rootCategories);

        // Act
        var result = await _controller.GetCategoriesByParent(null, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<ActionResult<IReadOnlyList<Category>>>(result);
        var returnValue = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedCategories = Assert.IsAssignableFrom<IReadOnlyList<Category>>(returnValue.Value);
        Assert.Equal(2, returnedCategories.Count);
        Assert.All(returnedCategories, cat => Assert.Null(cat.ParentCategoryId));
    }

    [Fact]
    public async Task GetCategoriesByParent_WithParentId_ReturnsChildCategories()
    {
        // Arrange
        var parentId = "electronics";
        var childCategories = new List<Category>
        {
            new() { Id = "3", Name = "Laptops", Slug = "laptops", ParentCategoryId = parentId },
            new() { Id = "4", Name = "Phones", Slug = "phones", ParentCategoryId = parentId }
        };
        _mockRepository
            .Setup(r => r.GetChildrenCategoriesAsync(parentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(childCategories);

        // Act
        var result = await _controller.GetCategoriesByParent(parentId, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<ActionResult<IReadOnlyList<Category>>>(result);
        var returnValue = Assert.IsType<OkObjectResult>(okResult.Result);
        var returnedCategories = Assert.IsAssignableFrom<IReadOnlyList<Category>>(returnValue.Value);
        Assert.Equal(2, returnedCategories.Count);
        Assert.All(returnedCategories, cat => Assert.Equal(parentId, cat.ParentCategoryId));
    }

    [Fact]
    public void Constructor_WithNullRepository_ThrowsArgumentNullException()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => new CategoriesController(null!));
    }
}
