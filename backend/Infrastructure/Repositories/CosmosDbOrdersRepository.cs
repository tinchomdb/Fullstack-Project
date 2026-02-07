using Application.Repositories;
using Domain.Entities;
using Infrastructure.Configuration;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace Infrastructure.Repositories;

public sealed class CosmosDbOrdersRepository : IOrdersRepository
{
    private readonly Container _container;

    public CosmosDbOrdersRepository(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> cosmosDbSettings)
    {
        var settings = cosmosDbSettings.Value;
        var database = cosmosClient.GetDatabase(settings.DatabaseName);
        _container = database.GetContainer(settings.ContainerNames.Orders);
    }

    public async Task<IReadOnlyList<Order>> GetOrdersByUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.userId = @userId AND c.type = @type ORDER BY c.orderDate DESC")
            .WithParameter("@userId", userId)
            .WithParameter("@type", "Order");

        var iterator = _container.GetItemQueryIterator<Order>(
            query,
            requestOptions: new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(userId)
            });

        var orders = new List<Order>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            orders.AddRange(response);
        }

        return orders.AsReadOnly();
    }

    public async Task<Order?> GetOrderAsync(
        string orderId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _container.ReadItemAsync<Order>(
                orderId,
                new PartitionKey(userId),
                cancellationToken: cancellationToken);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<Order?> GetOrderByPaymentIntentIdAsync(
        string paymentIntentId,
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.paymentIntentId = @paymentIntentId AND c.type = @type")
            .WithParameter("@paymentIntentId", paymentIntentId)
            .WithParameter("@type", "Order");

        var iterator = _container.GetItemQueryIterator<Order>(query);

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            var order = response.FirstOrDefault();

            if (order is not null)
            {
                return order;
            }
        }

        return null;
    }

    public async Task<Order> CreateOrderAsync(
        Order order,
        CancellationToken cancellationToken = default)
    {
        var response = await _container.CreateItemAsync(
            order,
            new PartitionKey(order.UserId),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task<Order> UpdateOrderAsync(
        Order order,
        CancellationToken cancellationToken = default)
    {
        var response = await _container.ReplaceItemAsync(
            order,
            order.Id,
            new PartitionKey(order.UserId),
            cancellationToken: cancellationToken);

        return response.Resource;
    }
}