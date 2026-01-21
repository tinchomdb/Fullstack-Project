using Infrastructure.Configuration;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services;

public class CosmosDbInitializationService
{
    private readonly CosmosClient _cosmosClient;
    private readonly CosmosDbSettings _settings;

    public CosmosDbInitializationService(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> settings)
    {
        _cosmosClient = cosmosClient;
        _settings = settings.Value;
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        // Create database if it doesn't exist
        var database = await _cosmosClient.CreateDatabaseIfNotExistsAsync(
            _settings.DatabaseName,
            ThroughputProperties.CreateManualThroughput(400), // Shared throughput
            cancellationToken: cancellationToken);

        Console.WriteLine($"Database '{_settings.DatabaseName}' created or already exists.");

        // Create containers with proper partition keys
        await CreateContainerAsync(
            database.Database,
            _settings.ContainersNames.Products,
            "/sellerId",
            "Products container - Optimized for seller-specific queries",
            cancellationToken);

        await CreateContainerAsync(
            database.Database,
            _settings.ContainersNames.Orders,
            "/userId",
            "Orders container - Optimized for user order history",
            cancellationToken);

        await CreateContainerAsync(
            database.Database,
            _settings.ContainersNames.Carts,
            "/userId",
            "Carts container - Optimized for user cart operations (id = userId)",
            cancellationToken);

        await CreateContainerAsync(
            database.Database,
            _settings.ContainersNames.Users,
            "/id",
            "Users container - User profiles and seller information",
            cancellationToken);

        await CreateContainerAsync(
            database.Database,
            _settings.ContainersNames.Categories,
            "/id",
            "Categories container - Product categories (cache-friendly)",
            cancellationToken);

        await CreateContainerAsync(
            database.Database,
            _settings.ContainersNames.CarouselSlides,
            "/partitionKey",
            "Carousel Slides container - Homepage carousel management",
            cancellationToken);

        Console.WriteLine("All containers initialized successfully!");
    }

    private static async Task CreateContainerAsync(
        Database database,
        string containerName,
        string partitionKeyPath,
        string description,
        CancellationToken cancellationToken)
    {
        var containerProperties = new ContainerProperties
        {
            Id = containerName,
            PartitionKeyPath = partitionKeyPath,
        };

        // Optimize indexing policy
        containerProperties.IndexingPolicy.IndexingMode = IndexingMode.Consistent;

        // Exclude large fields from indexing to reduce RU costs
        if (containerName == "products")
        {
            containerProperties.IndexingPolicy.ExcludedPaths.Add(
                new ExcludedPath { Path = "/description/*" });
            containerProperties.IndexingPolicy.ExcludedPaths.Add(
                new ExcludedPath { Path = "/imageUrls/*" });

            // Include composite index for category + price sorting
            containerProperties.IndexingPolicy.IncludedPaths.Add(
                new IncludedPath { Path = "/*" });
        }

        // Set TTL for carts (30 days for abandoned carts)
        if (containerName == "carts")
        {
            containerProperties.DefaultTimeToLive = 2592000; // 30 days in seconds
        }

        var container = await database.CreateContainerIfNotExistsAsync(
            containerProperties,
            cancellationToken: cancellationToken);

        Console.WriteLine($"  ✓ Container '{containerName}' created or already exists.");
        Console.WriteLine($"    Partition Key: {partitionKeyPath}");
        Console.WriteLine($"    Description: {description}");
    }
}