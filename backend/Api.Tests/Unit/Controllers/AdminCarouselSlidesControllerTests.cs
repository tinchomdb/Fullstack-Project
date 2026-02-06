using Api.Controllers;
using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Api.Tests.Unit.Controllers;

public class AdminCarouselSlidesControllerTests
{
    private readonly Mock<ICarouselSlidesRepository> _mockRepository;
    private readonly AdminCarouselSlidesController _controller;

    public AdminCarouselSlidesControllerTests()
    {
        _mockRepository = new Mock<ICarouselSlidesRepository>();
        _controller = new AdminCarouselSlidesController(_mockRepository.Object);
    }

    [Fact]
    public void Constructor_WithNullRepository_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new AdminCarouselSlidesController(null!));
    }

    // ===== GetSlides =====

    [Fact]
    public async Task GetSlides_ReturnsOkWithSlides()
    {
        // Arrange
        var slides = new List<CarouselSlide>
        {
            new() { Id = "s1", ImageUrl = "https://img.com/1.jpg", Alt = "Slide 1" },
            new() { Id = "s2", ImageUrl = "https://img.com/2.jpg", Alt = "Slide 2" }
        };
        _mockRepository
            .Setup(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(slides);

        // Act
        var result = await _controller.GetSlides(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<CarouselSlide>>(okResult.Value);
        Assert.Equal(2, returned.Count);
    }

    // ===== GetActiveSlides =====

    [Fact]
    public async Task GetActiveSlides_ReturnsOkWithActiveSlides()
    {
        // Arrange
        var slides = new List<CarouselSlide>
        {
            new() { Id = "s1", IsActive = true }
        };
        _mockRepository
            .Setup(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(slides);

        // Act
        var result = await _controller.GetActiveSlides(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<CarouselSlide>>(okResult.Value);
        Assert.Single(returned);
    }

    // ===== GetSlide =====

    [Fact]
    public async Task GetSlide_WithValidId_ReturnsOk()
    {
        // Arrange
        var slide = new CarouselSlide { Id = "s1", Alt = "Test" };
        _mockRepository
            .Setup(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(slide);

        // Act
        var result = await _controller.GetSlide("s1", CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<CarouselSlide>(okResult.Value);
        Assert.Equal("s1", returned.Id);
    }

    [Fact]
    public async Task GetSlide_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetSlideAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((CarouselSlide?)null);

        // Act
        var result = await _controller.GetSlide("missing", CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task GetSlide_WithEmptyOrNullId_ReturnsBadRequest(string? slideId)
    {
        // Act
        var result = await _controller.GetSlide(slideId!, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ===== CreateSlide =====

    [Fact]
    public async Task CreateSlide_WithValidRequest_ReturnsCreatedAtAction()
    {
        // Arrange
        var request = new CreateCarouselSlideRequest
        {
            ImageUrl = "https://img.com/new.jpg",
            Alt = "New Slide",
            Order = 3,
            IsActive = true
        };
        _mockRepository
            .Setup(r => r.CreateSlideAsync(It.IsAny<CarouselSlide>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((CarouselSlide s, CancellationToken _) => s);

        // Act
        var result = await _controller.CreateSlide(request, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<CarouselSlide>(createdResult.Value);
        Assert.Equal("https://img.com/new.jpg", returned.ImageUrl);
        Assert.Equal("New Slide", returned.Alt);
        Assert.Equal(3, returned.Order);
        Assert.True(returned.IsActive);
    }

    [Fact]
    public async Task CreateSlide_WithoutOptionalFields_UsesDefaults()
    {
        // Arrange
        var request = new CreateCarouselSlideRequest
        {
            ImageUrl = "https://img.com/new.jpg",
            Alt = "Test"
        };
        _mockRepository
            .Setup(r => r.CreateSlideAsync(It.IsAny<CarouselSlide>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((CarouselSlide s, CancellationToken _) => s);

        // Act
        var result = await _controller.CreateSlide(request, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<CarouselSlide>(createdResult.Value);
        Assert.Equal(1, returned.Order);   // Default
        Assert.True(returned.IsActive);     // Default
    }

    // ===== UpdateSlide =====

    [Fact]
    public async Task UpdateSlide_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var existingSlide = new CarouselSlide
        {
            Id = "s1",
            ImageUrl = "https://img.com/old.jpg",
            Alt = "Old",
            Order = 1,
            IsActive = true
        };
        var request = new UpdateCarouselSlideRequest
        {
            Alt = "Updated Alt"
        };
        _mockRepository
            .Setup(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingSlide);
        _mockRepository
            .Setup(r => r.UpdateSlideAsync(It.IsAny<CarouselSlide>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((CarouselSlide s, CancellationToken _) => s);

        // Act
        var result = await _controller.UpdateSlide("s1", request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<CarouselSlide>(okResult.Value);
        Assert.Equal("Updated Alt", returned.Alt);
        Assert.Equal("https://img.com/old.jpg", returned.ImageUrl); // Unchanged
    }

    [Fact]
    public async Task UpdateSlide_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetSlideAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((CarouselSlide?)null);
        var request = new UpdateCarouselSlideRequest { Alt = "X" };

        // Act
        var result = await _controller.UpdateSlide("missing", request, CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UpdateSlide_WithEmptyId_ReturnsBadRequest(string? slideId)
    {
        // Arrange
        var request = new UpdateCarouselSlideRequest { Alt = "X" };

        // Act
        var result = await _controller.UpdateSlide(slideId!, request, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    // ===== DeleteSlide =====

    [Fact]
    public async Task DeleteSlide_WhenExists_ReturnsNoContent()
    {
        // Arrange
        var slide = new CarouselSlide { Id = "s1" };
        _mockRepository
            .Setup(r => r.GetSlideAsync("s1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(slide);

        // Act
        var result = await _controller.DeleteSlide("s1", CancellationToken.None);

        // Assert
        Assert.IsType<NoContentResult>(result);
        _mockRepository.Verify(r => r.DeleteSlideAsync("s1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteSlide_WhenNotFound_ReturnsNotFound()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetSlideAsync("missing", It.IsAny<CancellationToken>()))
            .ReturnsAsync((CarouselSlide?)null);

        // Act
        var result = await _controller.DeleteSlide("missing", CancellationToken.None);

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task DeleteSlide_WithEmptyId_ReturnsBadRequest(string? slideId)
    {
        // Act
        var result = await _controller.DeleteSlide(slideId!, CancellationToken.None);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ===== ReorderSlides =====

    [Fact]
    public async Task ReorderSlides_WithValidRequest_ReturnsOk()
    {
        // Arrange
        var request = new ReorderCarouselSlidesRequest { SlideIds = ["s2", "s1", "s3"] };
        var reordered = new List<CarouselSlide>
        {
            new() { Id = "s2", Order = 1 },
            new() { Id = "s1", Order = 2 },
            new() { Id = "s3", Order = 3 }
        };
        _mockRepository
            .Setup(r => r.ReorderSlidesAsync(request.SlideIds, It.IsAny<CancellationToken>()))
            .ReturnsAsync(reordered);

        // Act
        var result = await _controller.ReorderSlides(request, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<CarouselSlide>>(okResult.Value);
        Assert.Equal(3, returned.Count);
        Assert.Equal("s2", returned[0].Id);
    }
}
