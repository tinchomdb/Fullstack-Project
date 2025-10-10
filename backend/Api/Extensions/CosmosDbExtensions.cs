using Api.Configuration;
using Api.Repositories;
using Api.Services;
using Microsoft.Azure.Cosmos;

namespace Api.Extensions;

public static class CosmosDbExtensions
{
    public static IServiceCollection AddCosmosDb(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure settings
        services.Configure<CosmosDbSettings>(configuration.GetSection("CosmosDb"));

        // Register CosmosClient as singleton
        services.AddSingleton(serviceProvider =>
        {
            var cosmosDbSettings = configuration.GetSection("CosmosDb").Get<CosmosDbSettings>();
            return new CosmosClient(
                cosmosDbSettings!.Account,
                cosmosDbSettings.Key,
                new CosmosClientOptions
                {
                    SerializerOptions = new CosmosSerializationOptions
                    {
                        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                    }
                });
        });

        // Register repository implementations
        services.AddSingleton<IProductsRepository, CosmosDbProductsRepository>();
        services.AddSingleton<ICategoriesRepository, CosmosDbCategoriesRepository>();
        services.AddSingleton<ICartsRepository, CosmosDbCartsRepository>();
        services.AddSingleton<IOrdersRepository, CosmosDbOrdersRepository>();
        services.AddSingleton<IUsersRepository, CosmosDbUsersRepository>();

        // Register database services
        services.AddSingleton<CosmosDbInitializationService>();
        services.AddSingleton<DataSeedingService>();

        return services;
    }

    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        try
        {
            var initService = app.Services.GetRequiredService<CosmosDbInitializationService>();
            await initService.InitializeAsync();
            
            var seedService = app.Services.GetRequiredService<DataSeedingService>();
            await seedService.SeedDataAsync();
        }
        catch (Exception ex)
        {
            app.Logger.LogError(ex, "An error occurred while initializing the database");
            throw;
        }
    }
}
