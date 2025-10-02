using Api.Configuration;
using Api.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using UserModel = Api.Models.User;

namespace Api.Repositories;

public class CosmosDbMarketplaceRepository : IMarketplaceRepository
{
    private readonly Container _productsContainer;
    private readonly Container _cartsContainer;
    private readonly Container _ordersContainer;
    private readonly Container _categoriesContainer;
    private readonly Container _usersContainer;

    public CosmosDbMarketplaceRepository(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> cosmosDbSettings)
    {
        var settings = cosmosDbSettings.Value;
        var database = cosmosClient.GetDatabase(settings.DatabaseName);

        _productsContainer = database.GetContainer(settings.ContainersNames.Products);
        _cartsContainer = database.GetContainer(settings.ContainersNames.Carts);
        _ordersContainer = database.GetContainer(settings.ContainersNames.Orders);
        _categoriesContainer = database.GetContainer(settings.ContainersNames.Categories);
        _usersContainer = database.GetContainer(settings.ContainersNames.Users);
    }

    #region Products - Partitioned by SellerId

    public async Task<IReadOnlyList<Product>> GetProductsBySellerAsync(
        string sellerId,
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.sellerId = @sellerId AND c.type = @type")
            .WithParameter("@sellerId", sellerId)
            .WithParameter("@type", "Product");

        var iterator = _productsContainer.GetItemQueryIterator<Product>(
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
            var response = await _productsContainer.ReadItemAsync<Product>(
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
        // Cross-partition query - consider using materialized view for production
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE ARRAY_CONTAINS(c.categoryIds, @categoryId) AND c.type = @type")
            .WithParameter("@categoryId", categoryId)
            .WithParameter("@type", "Product");

        var iterator = _productsContainer.GetItemQueryIterator<Product>(query);
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
        var response = await _productsContainer.CreateItemAsync(
            product,
            new PartitionKey(product.SellerId),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task<Product> UpdateProductAsync(
        Product product,
        CancellationToken cancellationToken = default)
    {
        var response = await _productsContainer.ReplaceItemAsync(
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
        await _productsContainer.DeleteItemAsync<Product>(
            productId,
            new PartitionKey(sellerId),
            cancellationToken: cancellationToken);
    }

    #endregion

    #region Categories - Partitioned by Id

    public async Task<IReadOnlyList<Category>> GetCategoriesAsync(
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.type = @type")
            .WithParameter("@type", "Category");

        var iterator = _categoriesContainer.GetItemQueryIterator<Category>(query);
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
            var response = await _categoriesContainer.ReadItemAsync<Category>(
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
        var response = await _categoriesContainer.CreateItemAsync(
            category,
            new PartitionKey(category.Id),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    #endregion

    #region Carts - Partitioned by UserId

    public async Task<Cart?> GetCartByUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Ultra-efficient point read - 1 RU (id = userId)
            var response = await _cartsContainer.ReadItemAsync<Cart>(
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
        var response = await _cartsContainer.UpsertItemAsync(
            cart,
            new PartitionKey(cart.UserId),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task DeleteCartAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        await _cartsContainer.DeleteItemAsync<Cart>(
            userId,
            new PartitionKey(userId),
            cancellationToken: cancellationToken);
    }

    #endregion

    #region Orders - Partitioned by UserId

    public async Task<IReadOnlyList<Order>> GetOrdersByUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.userId = @userId AND c.type = @type ORDER BY c.orderDate DESC")
            .WithParameter("@userId", userId)
            .WithParameter("@type", "Order");

        var iterator = _ordersContainer.GetItemQueryIterator<Order>(
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
            var response = await _ordersContainer.ReadItemAsync<Order>(
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

    public async Task<Order> CreateOrderAsync(
        Order order,
        CancellationToken cancellationToken = default)
    {
        var response = await _ordersContainer.CreateItemAsync(
            order,
            new PartitionKey(order.UserId),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task<Order> UpdateOrderAsync(
        Order order,
        CancellationToken cancellationToken = default)
    {
        var response = await _ordersContainer.ReplaceItemAsync(
            order,
            order.Id,
            new PartitionKey(order.UserId),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    #endregion

    #region Users - Partitioned by Id

    public async Task<UserModel?> GetUserAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Point read - 1 RU
            var response = await _usersContainer.ReadItemAsync<UserModel>(
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

        var iterator = _usersContainer.GetItemQueryIterator<UserModel>(query);

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
        var response = await _usersContainer.CreateItemAsync(
            user,
            new PartitionKey(user.Id),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task<UserModel> UpdateUserAsync(
        UserModel user,
        CancellationToken cancellationToken = default)
    {
        var response = await _usersContainer.ReplaceItemAsync(
            user,
            user.Id,
            new PartitionKey(user.Id),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    #endregion
}
