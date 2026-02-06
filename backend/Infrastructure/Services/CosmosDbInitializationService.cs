using Infrastructure.Configuration;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Services;

public sealed class CosmosDbInitializationService
{
    private const int DefaultThroughput = 400;
    private const int CartTtlSeconds = 30 * 24 * 60 * 60; // 30 days

    private readonly CosmosClient _cosmosClient;
    private readonly CosmosDbSettings _settings;
    private readonly ILogger<CosmosDbInitializationService> _logger;

    public CosmosDbInitializationService(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> settings,
        ILogger<CosmosDbInitializationService> logger)
    {
        _cosmosClient = cosmosClient ?? throw new ArgumentNullException(nameof(cosmosClient));
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        var database = await _cosmosClient.CreateDatabaseIfNotExistsAsync(
            _settings.DatabaseName,
            ThroughputProperties.CreateManualThroughput(DefaultThroughput),
            cancellationToken: cancellationToken);

        _logger.LogInformation("Database '{DatabaseName}' created or already exists", _settings.DatabaseName);

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

        _logger.LogInformation("All containers initialized successfully");
    }

    private async Task CreateContainerAsync(
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
            containerProperties.DefaultTimeToLive = CartTtlSeconds;
        }

        var container = await database.CreateContainerIfNotExistsAsync(
            containerProperties,
            cancellationToken: cancellationToken);

        _logger.LogInformation(
            "Container '{ContainerName}' ready (partition: {PartitionKey})",
            containerName,
            partitionKeyPath);
    }
}