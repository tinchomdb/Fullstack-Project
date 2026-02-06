using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CategoriesController(ICategoriesRepository repository) : ControllerBase
{
    private readonly ICategoriesRepository _repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Category>>> GetCategories(CancellationToken cancellationToken)
    {
        var categories = await _repository.GetCategoriesAsync(cancellationToken);
        return Ok(categories);
    }

    [HttpGet("{categoryId}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Category>> GetCategory(string categoryId, CancellationToken cancellationToken)
    {
        var category = await _repository.GetCategoryAsync(categoryId, cancellationToken);

        if (category is null)
        {
            return NotFound();
        }

        return Ok(category);
    }

    [HttpGet("by-parent")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Category>>> GetCategoriesByParent(
        [FromQuery] string? parentId,
        CancellationToken cancellationToken)
    {
        var categories = await _repository.GetChildrenCategoriesAsync(parentId, cancellationToken);
        return Ok(categories);
    }
}
