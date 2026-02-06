using Api.Controllers;
using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace Api.Tests.Unit.Controllers;

public class CarouselSlidesControllerTests
{
    private readonly Mock<ICarouselSlidesRepository> _mockRepository;
    private readonly CarouselSlidesController _controller;

    public CarouselSlidesControllerTests()
    {
        _mockRepository = new Mock<ICarouselSlidesRepository>();
        _controller = new CarouselSlidesController(_mockRepository.Object);
    }

    [Fact]
    public void Constructor_WithNullRepository_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(() => new CarouselSlidesController(null!));
    }

    [Fact]
    public async Task GetActiveSlides_ReturnsOkWithActiveSlides()
    {
        // Arrange
        var slides = new List<CarouselSlide>
        {
            new() { Id = "s1", IsActive = true },
            new() { Id = "s2", IsActive = true }
        };
        _mockRepository
            .Setup(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(slides);

        // Act
        var result = await _controller.GetActiveSlides(CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<CarouselSlide>>(okResult.Value);
        Assert.Equal(2, returned.Count);
    }

    [Fact]
    public async Task GetActiveSlides_CallsGetActiveSlidesAsync()
    {
        // Arrange
        _mockRepository
            .Setup(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CarouselSlide>());

        // Act
        await _controller.GetActiveSlides(CancellationToken.None);

        // Assert
        _mockRepository.Verify(r => r.GetActiveSlidesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mockRepository.Verify(r => r.GetAllSlidesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
