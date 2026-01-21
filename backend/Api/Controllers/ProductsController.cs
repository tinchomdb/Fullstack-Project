
using Application.Repositories;
using Domain.Entities;
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
        
        if (result.TotalPages > 0 && parameters.Page > result.TotalPages)
        {
            return BadRequest(new 
            { 
                error = $"Page {parameters.Page} exceeds total pages ({result.TotalPages}). Please request a page between 1 and {result.TotalPages}." 
            });
        }
        
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

    [HttpGet("by-slug/{slug}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> GetProductBySlug(string slug, CancellationToken cancellationToken)
    {
        var product = await repository.GetProductBySlugAsync(slug, cancellationToken);

        if (product is null)
        {
            return NotFound();
        }

        return Ok(product);
    }

    [HttpGet("featured")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Product>>> GetFeaturedProducts(
        [FromQuery] int limit = 20,
        [FromQuery] string? categoryId = null,
        CancellationToken cancellationToken = default)
    {
        var products = await repository.GetFeaturedProductsAsync(categoryId, limit, cancellationToken);
        return Ok(products);
    }
}
