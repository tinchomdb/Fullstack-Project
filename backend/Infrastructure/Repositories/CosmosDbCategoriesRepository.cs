using Application.Repositories;
using Domain.Entities;
using Infrastructure.Configuration;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace Infrastructure.Repositories;

public sealed class CosmosDbCategoriesRepository : ICategoriesRepository
{
    private readonly Container _container;

    public CosmosDbCategoriesRepository(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> cosmosDbSettings)
    {
        var settings = cosmosDbSettings.Value;
        var database = cosmosClient.GetDatabase(settings.DatabaseName);
        _container = database.GetContainer(settings.ContainersNames.Categories);
    }

    public async Task<IReadOnlyList<Category>> GetCategoriesAsync(
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.type = @type")
            .WithParameter("@type", "Category");

        var iterator = _container.GetItemQueryIterator<Category>(query);
        var categories = new List<Category>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            categories.AddRange(response);
        }

        return categories.AsReadOnly();
    }

    public async Task<Category?> GetCategoryAsync(
        string categoryId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Point read - 1 RU
            var response = await _container.ReadItemAsync<Category>(
                categoryId,
                new PartitionKey(categoryId),
                cancellationToken: cancellationToken);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<Category> CreateCategoryAsync(
        Category category,
        CancellationToken cancellationToken = default)
    {
        var response = await _container.CreateItemAsync(
            category,
            new PartitionKey(category.Id),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task<Category?> UpdateCategoryAsync(
        Category category,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _container.ReplaceItemAsync(
                category,
                category.Id,
                new PartitionKey(category.Id),
                cancellationToken: cancellationToken);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task DeleteCategoryAsync(
        string categoryId,
        CancellationToken cancellationToken = default)
    {
        await _container.DeleteItemAsync<Category>(
            categoryId,
            new PartitionKey(categoryId),
            cancellationToken: cancellationToken);
    }

    public async Task<IReadOnlyList<string>> GetAllDescendantCategoryIdsAsync(
        string categoryId,
        CancellationToken cancellationToken = default)
    {
        var allCategories = await GetCategoriesAsync(cancellationToken);
        var categoryLookup = allCategories.ToDictionary(c => c.Id);

        if (!categoryLookup.ContainsKey(categoryId))
        {
            return Array.Empty<string>();
        }

        var result = new List<string> { categoryId };
        var queue = new Queue<string>();
        queue.Enqueue(categoryId);

        while (queue.Count > 0)
        {
            var currentId = queue.Dequeue();
            
            // Find all categories that have this category as their parent
            var children = allCategories.Where(c => c.ParentCategoryId == currentId);
            
            foreach (var child in children)
            {
                if (!result.Contains(child.Id))
                {
                    result.Add(child.Id);
                    queue.Enqueue(child.Id);
                }
            }
        }

        return result.AsReadOnly();
    }

    public async Task<IReadOnlyList<Category>> GetChildrenCategoriesAsync(
        string? parentCategoryId,
        CancellationToken cancellationToken = default)
    {
        var allCategories = await GetCategoriesAsync(cancellationToken);
        
        // If parentCategoryId is null, return root categories (those with no parent)
        return allCategories
            .Where(c => c.ParentCategoryId == parentCategoryId)
            .ToList()
            .AsReadOnly();
    }
}