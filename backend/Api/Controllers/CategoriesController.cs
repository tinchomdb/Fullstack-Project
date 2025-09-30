using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CategoriesController : ControllerBase
{
    private readonly IMarketplaceRepository repository;

    public CategoriesController(IMarketplaceRepository repository)
    {
        this.repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<Category>> GetCategories()
    {
        var categories = repository.GetCategories();
        return Ok(categories);
    }

    [HttpGet("{categoryId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Category> GetCategory(Guid categoryId)
    {
        var category = repository.GetCategory(categoryId);

        if (category is null)
        {
            return NotFound();
        }

        return Ok(category);
    }
}
