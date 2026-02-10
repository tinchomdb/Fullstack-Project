using Api.Authentication;
using Api.DTOs;
using Application.Repositories;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = AuthConstants.AdminRole)]
public sealed class AdminProductsController(IProductsRepository repository) : ControllerBase
{
    private readonly IProductsRepository _repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Product>> CreateProduct([FromBody] CreateProductRequest request, CancellationToken cancellationToken)
    {
        var createdProduct = await _repository.CreateProductAsync(request.ToEntity(), cancellationToken);
        return CreatedAtAction("GetProduct", "Products", new { productId = createdProduct.Id, sellerId = createdProduct.SellerId }, createdProduct);
    }

    [HttpPut("{productId}/seller/{sellerId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Product>> UpdateProduct(string productId, string sellerId, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var existingProduct = await _repository.GetProductAsync(productId, sellerId, cancellationToken);

        if (existingProduct is null)
        {
            return NotFound();
        }

        var updatedProduct = await _repository.UpdateProductAsync(
            request.ToEntity(productId, sellerId, existingProduct.CreatedAt), cancellationToken);
        return Ok(updatedProduct);
    }

    [HttpDelete("{productId}/seller/{sellerId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProduct(string productId, string sellerId, CancellationToken cancellationToken)
    {
        var existingProduct = await _repository.GetProductAsync(productId, sellerId, cancellationToken);

        if (existingProduct is null)
        {
            return NotFound();
        }

        await _repository.DeleteProductAsync(productId, sellerId, cancellationToken);
        return NoContent();
    }
}