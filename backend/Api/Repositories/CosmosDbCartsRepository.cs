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

    public async Task<Cart?> GetCartByUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Ultra-efficient point read - 1 RU (id = userId)
            var response = await _container.ReadItemAsync<Cart>(
                userId,
                new PartitionKey(userId),
                cancellationToken: cancellationToken);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
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
        await _container.DeleteItemAsync<Cart>(
            userId,
            new PartitionKey(userId),
            cancellationToken: cancellationToken);
    }
}
