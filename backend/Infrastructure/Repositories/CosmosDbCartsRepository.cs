using Application.Repositories;
using Domain.Entities;
using Infrastructure.Configuration;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Repositories;

public sealed class CosmosDbCartsRepository : ICartsRepository
{
    private readonly Container _container;
    private readonly ILogger<CosmosDbCartsRepository> _logger;

    public CosmosDbCartsRepository(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> cosmosDbSettings,
        ILogger<CosmosDbCartsRepository> logger)
    {
        var settings = cosmosDbSettings.Value;
        var database = cosmosClient.GetDatabase(settings.DatabaseName);
        _container = database.GetContainer(settings.ContainersNames.Carts);
        _logger = logger;
    }

    public async Task<Cart?> GetActiveCartByUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Status is stored as integer in Cosmos DB (Cosmos serializer doesn't use System.Text.Json attributes)
            var statusValue = (int)CartStatus.Active;

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.userId = @userId AND c.status = @status ORDER BY c.lastUpdatedAt DESC")
                .WithParameter("@userId", userId)
                .WithParameter("@status", statusValue);

            var iterator = _container.GetItemQueryIterator<Cart>(query);
            var results = await iterator.ReadNextAsync(cancellationToken);

            return results.FirstOrDefault();
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<IReadOnlyList<Cart>> GetAllCartsAsync(
        CancellationToken cancellationToken = default)
    {
        var carts = new List<Cart>();

        try
        {
            var query = new QueryDefinition("SELECT * FROM c ORDER BY c.lastUpdatedAt DESC");

            var iterator = _container.GetItemQueryIterator<Cart>(query);

            while (iterator.HasMoreResults)
            {
                var results = await iterator.ReadNextAsync(cancellationToken);
                carts.AddRange(results);
            }

            return carts.AsReadOnly();
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return carts.AsReadOnly();
        }
    }

    public async Task<Cart> UpsertCartAsync(
        Cart cart,
        CancellationToken cancellationToken = default)
    {
        var response = await _container.UpsertItemAsync(
            cart,
            new PartitionKey(cart.UserId),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task DeleteCartAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Attempting to delete ALL active carts for user {UserId}", userId);
        
        try
        {
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.userId = @userId AND c.status = @status")
                .WithParameter("@userId", userId)
                .WithParameter("@status", (int)CartStatus.Active);

            var iterator = _container.GetItemQueryIterator<Cart>(query);
            var deletedCount = 0;

            while (iterator.HasMoreResults)
            {
                var results = await iterator.ReadNextAsync(cancellationToken);
                
                foreach (var cart in results)
                {
                    try
                    {
                        await _container.DeleteItemAsync<Cart>(
                            cart.Id,
                            new PartitionKey(cart.UserId),
                            cancellationToken: cancellationToken);
                        
                        deletedCount++;
                        _logger.LogInformation("Deleted cart {CartId} for user {UserId}", cart.Id, userId);
                    }
                    catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                    {
                        _logger.LogWarning("Cart {CartId} for user {UserId} was not found during delete", cart.Id, userId);
                    }
                }
            }
            
            _logger.LogInformation("Deleted {Count} cart(s) for user {UserId}", deletedCount, userId);
        }
        catch (CosmosException ex)
        {
            _logger.LogError(ex, "Error deleting carts for user {UserId}", userId);
            throw;
        }
    }
}