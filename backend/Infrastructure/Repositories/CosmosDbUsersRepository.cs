using Application.Repositories;
using Domain.Entities;
using Infrastructure.Configuration;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using UserModel = Domain.Entities.User;

namespace Infrastructure.Repositories;

public sealed class CosmosDbUsersRepository : IUsersRepository
{
    private readonly Container _container;

    public CosmosDbUsersRepository(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> cosmosDbSettings)
    {
        var settings = cosmosDbSettings.Value;
        var database = cosmosClient.GetDatabase(settings.DatabaseName);
        _container = database.GetContainer(settings.ContainersNames.Users);
    }

    public async Task<UserModel?> GetUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Point read - 1 RU
            var response = await _container.ReadItemAsync<UserModel>(
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

    public async Task<UserModel?> GetUserByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        // Cross-partition query - consider adding secondary index
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.email = @email AND c.type = @type")
            .WithParameter("@email", email)
            .WithParameter("@type", "User");

        var iterator = _container.GetItemQueryIterator<UserModel>(query);

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            return response.FirstOrDefault();
        }

        return null;
    }

    public async Task<UserModel> CreateUserAsync(
        UserModel user,
        CancellationToken cancellationToken = default)
    {
        var response = await _container.CreateItemAsync(
            user,
            new PartitionKey(user.Id),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task<UserModel> UpdateUserAsync(
        UserModel user,
        CancellationToken cancellationToken = default)
    {
        var response = await _container.ReplaceItemAsync(
            user,
            user.Id,
            new PartitionKey(user.Id),
            cancellationToken: cancellationToken);

        return response.Resource;
    }
}