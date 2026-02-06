using Api.DTOs;
using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "admin")]
public sealed class AdminCategoriesController(ICategoriesRepository repository) : ControllerBase
{
    private readonly ICategoriesRepository _repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Category>> CreateCategory([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var createdCategory = await _repository.CreateCategoryAsync(request.ToEntity(), cancellationToken);
        return CreatedAtAction("GetCategory", "Categories", new { categoryId = createdCategory.Id }, createdCategory);
    }

    [HttpPut("{categoryId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Category>> UpdateCategory(string categoryId, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var updatedCategory = await _repository.UpdateCategoryAsync(request.ToEntity(categoryId), cancellationToken);

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
        var category = await _repository.GetCategoryAsync(categoryId, cancellationToken);

        if (category is null)
        {
            return NotFound();
        }

        await _repository.DeleteCategoryAsync(categoryId, cancellationToken);
        return NoContent();
    }
}