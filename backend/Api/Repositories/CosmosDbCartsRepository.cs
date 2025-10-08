using Api.Configuration;
using Api.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace Api.Repositories;

public sealed class CosmosDbCartsRepository : ICartsRepository
{
    private readonly Container _container;

    public CosmosDbCartsRepository(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> cosmosDbSettings)
    {
        var settings = cosmosDbSettings.Value;
        var database = cosmosClient.GetDatabase(settings.DatabaseName);
        _container = database.GetContainer(settings.ContainersNames.Carts);
    }

    public async Task<Cart?> GetActiveCartByUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.userId = @userId AND c.status = @status ORDER BY c.lastUpdatedAt DESC")
                .WithParameter("@userId", userId)
                .WithParameter("@status", CartStatus.Active.ToString());

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
        // Get active cart for user and delete it
        var activeCart = await GetActiveCartByUserAsync(userId, cancellationToken);
        
        if (activeCart is not null)
        {
            await _container.DeleteItemAsync<Cart>(
                activeCart.Id,
                new PartitionKey(activeCart.UserId),
                cancellationToken: cancellationToken);
        }
    }
}
