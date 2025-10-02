using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CategoriesController(ICategoriesRepository repository) : ControllerBase
{
    private readonly ICategoriesRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Category>>> GetCategories(CancellationToken cancellationToken)
    {
        var categories = await repository.GetCategoriesAsync(cancellationToken);
        return Ok(categories);
    }

    [HttpGet("{categoryId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Category>> GetCategory(string categoryId, CancellationToken cancellationToken)
    {
        var category = await repository.GetCategoryAsync(categoryId, cancellationToken);

        if (category is null)
        {
            return NotFound();
        }

        return Ok(category);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<ActionResult<Category>> CreateCategory([FromBody] Category category, CancellationToken cancellationToken)
    {
        var createdCategory = await repository.CreateCategoryAsync(category, cancellationToken);
        return CreatedAtAction(nameof(GetCategory), new { categoryId = createdCategory.Id }, createdCategory);
    }
}
