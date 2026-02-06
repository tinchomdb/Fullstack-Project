using Api.DTOs;
using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/admin/slides")]
[Authorize(Roles = "admin")]
public sealed class AdminCarouselSlidesController(ICarouselSlidesRepository repository) : ControllerBase
{
    private readonly ICarouselSlidesRepository _repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<CarouselSlide>>> GetSlides(CancellationToken cancellationToken)
    {
        var slides = await _repository.GetAllSlidesAsync(cancellationToken);
        return Ok(slides);
    }

    [HttpGet("active")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CarouselSlide>>> GetActiveSlides(CancellationToken cancellationToken)
    {
        var slides = await _repository.GetActiveSlidesAsync(cancellationToken);
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

        var slide = await _repository.GetSlideAsync(slideId, cancellationToken);

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

        var createdSlide = await _repository.CreateSlideAsync(slide, cancellationToken);
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

        var existingSlide = await _repository.GetSlideAsync(slideId, cancellationToken);
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

        var result = await _repository.UpdateSlideAsync(updatedSlide, cancellationToken);
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

        var existingSlide = await _repository.GetSlideAsync(slideId, cancellationToken);
        if (existingSlide is null)
        {
            return NotFound();
        }

        await _repository.DeleteSlideAsync(slideId, cancellationToken);
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

        var reorderedSlides = await _repository.ReorderSlidesAsync(request.SlideIds, cancellationToken);
        return Ok(reorderedSlides);
    }
}