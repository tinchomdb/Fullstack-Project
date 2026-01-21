
using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "admin")]
public sealed class AdminProductsController(IProductsRepository repository) : ControllerBase
{
    private readonly IProductsRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Product>> CreateProduct([FromBody] Product product, CancellationToken cancellationToken)
    {
        var createdProduct = await repository.CreateProductAsync(product, cancellationToken);
        return CreatedAtAction("GetProduct", "Products", new { productId = createdProduct.Id, sellerId = createdProduct.SellerId }, createdProduct);
    }

    [HttpPut("{productId}/seller/{sellerId}")]
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
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteProduct(string productId, string sellerId, CancellationToken cancellationToken)
    {
        await repository.DeleteProductAsync(productId, sellerId, cancellationToken);
        return NoContent();
    }
}