using Api.Configuration;
using Api.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace Api.Repositories;

public sealed class CosmosDbProductsRepository : IProductsRepository
{
    private readonly Container _container;

    public CosmosDbProductsRepository(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> cosmosDbSettings)
    {
        var settings = cosmosDbSettings.Value;
        var database = cosmosClient.GetDatabase(settings.DatabaseName);
        _container = database.GetContainer(settings.ContainersNames.Products);
    }

    public async Task<IReadOnlyList<Product>> GetAllProductsAsync(
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.type = @type")
            .WithParameter("@type", "Product");

        var iterator = _container.GetItemQueryIterator<Product>(query);
        var products = new List<Product>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            products.AddRange(response);
        }

        return products.AsReadOnly();
    }

    public async Task<IReadOnlyList<Product>> GetProductsBySellerAsync(
        string sellerId,
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.sellerId = @sellerId AND c.type = @type")
            .WithParameter("@sellerId", sellerId)
            .WithParameter("@type", "Product");

        var iterator = _container.GetItemQueryIterator<Product>(
            query,
            requestOptions: new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(sellerId)
            });

        var products = new List<Product>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            products.AddRange(response);
        }

        return products.AsReadOnly();
    }

    public async Task<Product?> GetProductAsync(
        string productId,
        string sellerId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _container.ReadItemAsync<Product>(
                productId,
                new PartitionKey(sellerId),
                cancellationToken: cancellationToken);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<IReadOnlyList<Product>> GetProductsByCategoryAsync(
        string categoryId,
        CancellationToken cancellationToken = default)
    {
        // Cross-partition query - we could use a materialized view for a real application
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE ARRAY_CONTAINS(c.categoryIds, @categoryId) AND c.type = @type")
            .WithParameter("@categoryId", categoryId)
            .WithParameter("@type", "Product");

        var iterator = _container.GetItemQueryIterator<Product>(query);
        var products = new List<Product>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            products.AddRange(response);
        }

        return products.AsReadOnly();
    }

    public async Task<IReadOnlyList<Product>> GetProductsByCategoriesAsync(
        string[] categoryIds,
        CancellationToken cancellationToken = default)
    {
        if (categoryIds is null || categoryIds.Length == 0)
        {
            return Array.Empty<Product>();
        }

        // Build a query that checks if any of the product's categoryIds match any of the provided categoryIds
        var categoryConditions = string.Join(" OR ", 
            categoryIds.Select((_, index) => $"ARRAY_CONTAINS(c.categoryIds, @categoryId{index})"));

        var queryText = $"SELECT * FROM c WHERE ({categoryConditions}) AND c.type = @type";
        var query = new QueryDefinition(queryText).WithParameter("@type", "Product");

        for (int i = 0; i < categoryIds.Length; i++)
        {
            query = query.WithParameter($"@categoryId{i}", categoryIds[i]);
        }

        var iterator = _container.GetItemQueryIterator<Product>(query);
        var products = new List<Product>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            products.AddRange(response);
        }

        return products.AsReadOnly();
    }

    public async Task<Product> CreateProductAsync(
        Product product,
        CancellationToken cancellationToken = default)
    {
        var response = await _container.CreateItemAsync(
            product,
            new PartitionKey(product.SellerId),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task<Product> UpdateProductAsync(
        Product product,
        CancellationToken cancellationToken = default)
    {
        var response = await _container.ReplaceItemAsync(
            product,
            product.Id,
            new PartitionKey(product.SellerId),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task DeleteProductAsync(
        string productId,
        string sellerId,
        CancellationToken cancellationToken = default)
    {
        await _container.DeleteItemAsync<Product>(
            productId,
            new PartitionKey(sellerId),
            cancellationToken: cancellationToken);
    }
}
