using Application.Repositories;
using Application.Services;
using Infrastructure.Configuration;
using Infrastructure.Repositories;
using Infrastructure.Services;
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

        // Register concrete repository implementations
        services.AddSingleton<CosmosDbProductsRepository>();
        services.AddSingleton<CosmosDbCategoriesRepository>();
        services.AddSingleton<CosmosDbCartsRepository>();
        services.AddSingleton<CosmosDbOrdersRepository>();
        services.AddSingleton<CosmosDbUsersRepository>();
        services.AddSingleton<CosmosDbCarouselSlidesRepository>();

        // Register interfaces pointing to concrete implementations
        // These will be replaced by cached decorators if caching is enabled
        services.AddSingleton<IProductsRepository>(serviceProvider => serviceProvider.GetRequiredService<CosmosDbProductsRepository>());
        services.AddSingleton<ICategoriesRepository>(serviceProvider => serviceProvider.GetRequiredService<CosmosDbCategoriesRepository>());
        services.AddSingleton<ICartsRepository>(serviceProvider => serviceProvider.GetRequiredService<CosmosDbCartsRepository>());
        services.AddSingleton<IOrdersRepository>(serviceProvider => serviceProvider.GetRequiredService<CosmosDbOrdersRepository>());
        services.AddSingleton<IUsersRepository>(serviceProvider => serviceProvider.GetRequiredService<CosmosDbUsersRepository>());
        services.AddSingleton<ICarouselSlidesRepository>(serviceProvider => serviceProvider.GetRequiredService<CosmosDbCarouselSlidesRepository>());

        // Register database services
        services.AddSingleton<CosmosDbInitializationService>();
        services.AddSingleton<DataSeedingService>();

        // Register business services
        services.AddScoped<CartValidator>();
        services.AddScoped<CartMapper>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IOrderService, OrderService>();

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
