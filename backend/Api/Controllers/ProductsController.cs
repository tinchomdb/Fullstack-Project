using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ProductsController(IProductsRepository repository) : ControllerBase
{
    private readonly IProductsRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<PaginatedResponse<Product>>> GetAllProducts(
        [FromQuery] ProductQueryParameters parameters,
        CancellationToken cancellationToken)
    {
        var result = await repository.GetProductsAsync(parameters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("by-seller/{sellerId}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Product>>> GetProductsBySeller(string sellerId, CancellationToken cancellationToken)
    {
        var products = await repository.GetProductsBySellerAsync(sellerId, cancellationToken);
        return Ok(products);
    }

    [HttpGet("by-categories")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Product>>> GetProductsByCategories([FromQuery] string[] categoryIds, CancellationToken cancellationToken)
    {
        if (categoryIds is null || categoryIds.Length == 0)
        {
            return Ok(Array.Empty<Product>());
        }

        var products = await repository.GetProductsByCategoriesAsync(categoryIds, cancellationToken);
        return Ok(products);
    }

    [HttpGet("by-category/{categoryId}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Product>>> GetProductsByCategory(string categoryId, CancellationToken cancellationToken)
    {
        var products = await repository.GetProductsByCategoryAsync(categoryId, cancellationToken);
        return Ok(products);
    }

    [HttpGet("{productId}/seller/{sellerId}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> GetProduct(string productId, string sellerId, CancellationToken cancellationToken)
    {
        var product = await repository.GetProductAsync(productId, sellerId, cancellationToken);

        if (product is null)
        {
            return NotFound();
        }

        return Ok(product);
    }
}
