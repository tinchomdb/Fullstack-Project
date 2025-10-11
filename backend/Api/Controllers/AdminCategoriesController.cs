using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "admin")]
public sealed class AdminCategoriesController(ICategoriesRepository repository) : ControllerBase
{
    private readonly ICategoriesRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Category>> CreateCategory([FromBody] Category category, CancellationToken cancellationToken)
    {
        var createdCategory = await repository.CreateCategoryAsync(category, cancellationToken);
        return CreatedAtAction("GetCategory", "Categories", new { categoryId = createdCategory.Id }, createdCategory);
    }

    [HttpPut("{categoryId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Category>> UpdateCategory(string categoryId, [FromBody] Category category, CancellationToken cancellationToken)
    {
        if (category.Id != categoryId)
        {
            return BadRequest("Category ID must match route parameter");
        }

        var updatedCategory = await repository.UpdateCategoryAsync(category, cancellationToken);
        
        if (updatedCategory is null)
        {
            return NotFound();
        }

        return Ok(updatedCategory);
    }

    [HttpDelete("{categoryId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteCategory(string categoryId, CancellationToken cancellationToken)
    {
        var category = await repository.GetCategoryAsync(categoryId, cancellationToken);
        
        if (category is null)
        {
            return NotFound();
        }

        await repository.DeleteCategoryAsync(categoryId, cancellationToken);
        return NoContent();
    }
}