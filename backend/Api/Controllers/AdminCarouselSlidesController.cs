using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace Api.Controllers;

[ApiController]
[Route("api/admin/slides")]
[Authorize(Roles = "admin")]
public sealed class AdminCarouselSlidesController(ICarouselSlidesRepository repository) : ControllerBase
{
    private readonly ICarouselSlidesRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<CarouselSlide>>> GetSlides(CancellationToken cancellationToken)
    {
        var slides = await repository.GetAllSlidesAsync(cancellationToken);
        return Ok(slides);
    }

    [HttpGet("active")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CarouselSlide>>> GetActiveSlides(CancellationToken cancellationToken)
    {
        var slides = await repository.GetActiveSlidesAsync(cancellationToken);
        return Ok(slides);
    }

    [HttpGet("{slideId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CarouselSlide>> GetSlide(string slideId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(slideId))
        {
            return BadRequest("SlideId cannot be null or empty");
        }

        var slide = await repository.GetSlideAsync(slideId, cancellationToken);
        
        if (slide is null)
        {
            return NotFound();
        }

        return Ok(slide);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CarouselSlide>> CreateSlide([FromBody] CreateCarouselSlideRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var slide = new CarouselSlide
        {
            ImageUrl = request.ImageUrl,
            Alt = request.Alt,
            Order = request.Order ?? 1, // Default to 1 if not provided
            IsActive = request.IsActive ?? true
        };

        var createdSlide = await repository.CreateSlideAsync(slide, cancellationToken);
        return CreatedAtAction(nameof(GetSlide), new { slideId = createdSlide.Id }, createdSlide);
    }

    [HttpPut("{slideId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CarouselSlide>> UpdateSlide(string slideId, [FromBody] UpdateCarouselSlideRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(slideId))
        {
            return BadRequest("SlideId cannot be null or empty");
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var existingSlide = await repository.GetSlideAsync(slideId, cancellationToken);
        if (existingSlide is null)
        {
            return NotFound();
        }

        var updatedSlide = existingSlide with
        {
            ImageUrl = request.ImageUrl ?? existingSlide.ImageUrl,
            Alt = request.Alt ?? existingSlide.Alt,
            Order = request.Order ?? existingSlide.Order,
            IsActive = request.IsActive ?? existingSlide.IsActive
        };

        var result = await repository.UpdateSlideAsync(updatedSlide, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{slideId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSlide(string slideId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(slideId))
        {
            return BadRequest("SlideId cannot be null or empty");
        }

        var existingSlide = await repository.GetSlideAsync(slideId, cancellationToken);
        if (existingSlide is null)
        {
            return NotFound();
        }

        await repository.DeleteSlideAsync(slideId, cancellationToken);
        return NoContent();
    }

    [HttpPatch("reorder")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<CarouselSlide>>> ReorderSlides([FromBody] ReorderCarouselSlidesRequest request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var reorderedSlides = await repository.ReorderSlidesAsync(request.SlideIds, cancellationToken);
        return Ok(reorderedSlides);
    }
}

public record CreateCarouselSlideRequest
{
    [Required]
    [Url(ErrorMessage = "ImageUrl must be a valid URL")]
    [MaxLength(2048, ErrorMessage = "ImageUrl cannot exceed 2048 characters")]
    public required string ImageUrl { get; init; }

    [Required]
    [MaxLength(255, ErrorMessage = "Alt text cannot exceed 255 characters")]
    public required string Alt { get; init; }

    [Range(1, int.MaxValue, ErrorMessage = "Order must be a positive number")]
    public int? Order { get; init; }

    public bool? IsActive { get; init; }
}

public record UpdateCarouselSlideRequest
{
    [Url(ErrorMessage = "ImageUrl must be a valid URL")]
    [MaxLength(2048, ErrorMessage = "ImageUrl cannot exceed 2048 characters")]
    public string? ImageUrl { get; init; }

    [MaxLength(255, ErrorMessage = "Alt text cannot exceed 255 characters")]
    public string? Alt { get; init; }

    [Range(1, int.MaxValue, ErrorMessage = "Order must be a positive number")]
    public int? Order { get; init; }

    public bool? IsActive { get; init; }
}

public record ReorderCarouselSlidesRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one slide ID is required")]
    public required string[] SlideIds { get; init; }
}