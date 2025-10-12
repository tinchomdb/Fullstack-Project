using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/slides")]
public sealed class CarouselSlidesController(ICarouselSlidesRepository repository) : ControllerBase
{
    private readonly ICarouselSlidesRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
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
}