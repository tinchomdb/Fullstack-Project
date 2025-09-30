using Api.Models;
using Api.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class ProductsController(IMarketplaceRepository repository) : ControllerBase
{
    private readonly IMarketplaceRepository repository = repository ?? throw new ArgumentNullException(nameof(repository));

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult<IReadOnlyList<Product>> GetProducts()
    {
        var products = repository.GetProducts();
        return Ok(products);
    }

    [HttpGet("{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Product> GetProduct(Guid productId)
    {
        var product = repository.GetProduct(productId);

        if (product is null)
        {
            return NotFound();
        }

        return Ok(product);
    }
}
