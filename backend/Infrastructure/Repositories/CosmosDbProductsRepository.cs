using Application.Repositories;
using Domain.Entities;
using Infrastructure.Configuration;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace Infrastructure.Repositories;

public sealed class CosmosDbProductsRepository : IProductsRepository
{
    private readonly Container _container;
    private readonly ICategoriesRepository _categoriesRepository;

    public CosmosDbProductsRepository(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> cosmosDbSettings,
        ICategoriesRepository categoriesRepository)
    {
        var settings = cosmosDbSettings.Value;
        var database = cosmosClient.GetDatabase(settings.DatabaseName);
        _container = database.GetContainer(settings.ContainersNames.Products);
        _categoriesRepository = categoriesRepository ?? throw new ArgumentNullException(nameof(categoriesRepository));
    }

    public async Task<PaginatedResponse<Product>> GetProductsAsync(
        ProductQueryParameters parameters,
        CancellationToken cancellationToken = default)
    {
        var whereClauses = new List<string> { "c.type = @type" };
        string[]? categoryIdsToFilter = null;

        // When searching, bypass all other filters
        if (parameters.IsSearching)
        {
            whereClauses.Add("(CONTAINS(UPPER(c.name), UPPER(@searchTerm)) OR CONTAINS(UPPER(c.description), UPPER(@searchTerm)))");
        }
        else
        {
            // Apply filters only when not searching
            if (parameters.MinPrice.HasValue)
            {
                whereClauses.Add("c.price >= @minPrice");
            }

            if (parameters.MaxPrice.HasValue)
            {
                whereClauses.Add("c.price <= @maxPrice");
            }

            if (!string.IsNullOrEmpty(parameters.CategoryId))
            {
                var descendantCategoryIds = await _categoriesRepository.GetAllDescendantCategoryIdsAsync(
                    parameters.CategoryId,
                    cancellationToken);

                categoryIdsToFilter = descendantCategoryIds.ToArray();

                if (categoryIdsToFilter.Length > 0)
                {
                    var categoryConditions = string.Join(" OR ",
                        categoryIdsToFilter.Select((_, index) => $"ARRAY_CONTAINS(c.categoryIds, @categoryId{index})"));
                    whereClauses.Add($"({categoryConditions})");
                }
            }
        }

        var whereClause = string.Join(" AND ", whereClauses);

        var sortBy = parameters.SortBy?.ToLowerInvariant();
        var sortField = sortBy == "price" ? "c.price" : "c.name";
        var sortDirection = parameters.SortDirection?.ToLowerInvariant() == "desc" ? "DESC" : "ASC";

        var offset = (parameters.Page - 1) * parameters.PageSize;

        var mainQueryText = $"SELECT * FROM c WHERE {whereClause} ORDER BY {sortField} {sortDirection} OFFSET @offset LIMIT @limit";
        var queryDefinition = BuildQueryWithParameters(mainQueryText, parameters, offset, categoryIdsToFilter);

        var iterator = _container.GetItemQueryIterator<Product>(queryDefinition);
        var products = new List<Product>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            products.AddRange(response);
        }

        var countQueryText = $"SELECT VALUE COUNT(1) FROM c WHERE {whereClause}";
        var countQuery = BuildQueryWithParameters(countQueryText, parameters, null, categoryIdsToFilter);

        var countIterator = _container.GetItemQueryIterator<int>(countQuery);
        var countResponse = await countIterator.ReadNextAsync(cancellationToken);
        var totalCount = countResponse.FirstOrDefault();

        return new PaginatedResponse<Product>(
            products.AsReadOnly(),
            totalCount,
            parameters.Page,
            parameters.PageSize);
    }

    private static QueryDefinition BuildQueryWithParameters(
        string queryText,
        ProductQueryParameters parameters,
        int? offset,
        string[]? categoryIdsToFilter = null)
    {
        var query = new QueryDefinition(queryText).WithParameter("@type", "Product");

        if (offset.HasValue)
        {
            query = query
                .WithParameter("@offset", offset.Value)
                .WithParameter("@limit", parameters.PageSize);
        }

        if (parameters.IsSearching)
        {
            query = query.WithParameter("@searchTerm", parameters.SearchTerm!);
        }
        else
        {
            if (parameters.MinPrice.HasValue)
            {
                query = query.WithParameter("@minPrice", parameters.MinPrice.Value);
            }

            if (parameters.MaxPrice.HasValue)
            {
                query = query.WithParameter("@maxPrice", parameters.MaxPrice.Value);
            }

            if (categoryIdsToFilter is not null && categoryIdsToFilter.Length > 0)
            {
                for (int i = 0; i < categoryIdsToFilter.Length; i++)
                {
                    query = query.WithParameter($"@categoryId{i}", categoryIdsToFilter[i]);
                }
            }
        }

        return query;
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

    public async Task<Product?> GetProductBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.slug = @slug AND c.type = @type")
            .WithParameter("@slug", slug)
            .WithParameter("@type", "Product");

        var iterator = _container.GetItemQueryIterator<Product>(query);
        var products = new List<Product>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            products.AddRange(response);
        }

        return products.FirstOrDefault();
    }

    public async Task<IReadOnlyList<Product>> GetFeaturedProductsAsync(
        string? categoryId = null,
        int limit = 20,
        CancellationToken cancellationToken = default)
    {
        const int MaxLimit = 50;
        var effectiveLimit = Math.Min(Math.Max(1, limit), MaxLimit);

        string queryText;
        string[]? categoryIdsToFilter = null;

        if (string.IsNullOrEmpty(categoryId))
        {
            queryText = "SELECT TOP @limit * FROM c WHERE c.featured = true AND c.type = @type ORDER BY c.createdAt DESC";
        }
        else
        {
            var descendantCategoryIds = await _categoriesRepository.GetAllDescendantCategoryIdsAsync(
                categoryId,
                cancellationToken);

            categoryIdsToFilter = descendantCategoryIds.ToArray();

            if (categoryIdsToFilter.Length > 0)
            {
                var categoryConditions = string.Join(" OR ",
                    categoryIdsToFilter.Select((_, index) => $"ARRAY_CONTAINS(c.categoryIds, @categoryId{index})"));
                queryText = $"SELECT TOP @limit * FROM c WHERE c.featured = true AND ({categoryConditions}) AND c.type = @type ORDER BY c.createdAt DESC";
            }
            else
            {
                queryText = "SELECT TOP @limit * FROM c WHERE c.featured = true AND ARRAY_CONTAINS(c.categoryIds, @categoryId0) AND c.type = @type ORDER BY c.createdAt DESC";
                categoryIdsToFilter = [categoryId];
            }
        }

        var query = new QueryDefinition(queryText)
            .WithParameter("@type", "Product")
            .WithParameter("@limit", effectiveLimit);

        if (categoryIdsToFilter is not null && categoryIdsToFilter.Length > 0)
        {
            for (int i = 0; i < categoryIdsToFilter.Length; i++)
            {
                query = query.WithParameter($"@categoryId{i}", categoryIdsToFilter[i]);
            }
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