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
    public async Task<ActionResult<IReadOnlyList<Product>>> GetAllProducts(CancellationToken cancellationToken)
    {
        var products = await repository.GetAllProductsAsync(cancellationToken);
        return Ok(products);
    }

    [HttpGet("by-seller/{sellerId}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<Product>>> GetProductsBySeller(string sellerId, CancellationToken cancellationToken)
    {
        var products = await repository.GetProductsBySellerAsync(sellerId, cancellationToken);
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

    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Product>> CreateProduct([FromBody] Product product, CancellationToken cancellationToken)
    {
        var createdProduct = await repository.CreateProductAsync(product, cancellationToken);
        return CreatedAtAction(nameof(GetProduct), new { productId = createdProduct.Id, sellerId = createdProduct.SellerId }, createdProduct);
    }

    [HttpPut("{productId}/seller/{sellerId}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Product>> UpdateProduct(string productId, string sellerId, [FromBody] Product product, CancellationToken cancellationToken)
    {
        if (product.Id != productId || product.SellerId != sellerId)
        {
            return BadRequest("Product ID and SellerId must match route parameters");
        }

        var updatedProduct = await repository.UpdateProductAsync(product, cancellationToken);
        return Ok(updatedProduct);
    }

    [HttpDelete("{productId}/seller/{sellerId}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteProduct(string productId, string sellerId, CancellationToken cancellationToken)
    {
        await repository.DeleteProductAsync(productId, sellerId, cancellationToken);
        return NoContent();
    }
}
