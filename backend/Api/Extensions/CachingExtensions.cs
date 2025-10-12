using Api.Configuration;
using Api.Repositories;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Api.Extensions;

public static class CachingExtensions
{
    public static IServiceCollection AddCaching(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure cache settings
        services.Configure<CacheSettings>(configuration.GetSection("CacheSettings"));

        // Add memory cache
        services.AddMemoryCache();

        return services;
    }

    public static IServiceCollection DecorateRepositoriesWithCaching(this IServiceCollection services)
    {
        // Decorate Categories Repository
        services.AddSingleton<ICategoriesRepository>(serviceProvider =>
        {
            var inner = serviceProvider.GetRequiredService<CosmosDbCategoriesRepository>();
            var cache = serviceProvider.GetRequiredService<IMemoryCache>();
            var settings = serviceProvider.GetRequiredService<IOptions<CacheSettings>>();
            var logger = serviceProvider.GetRequiredService<ILogger<CachedCategoriesRepository>>();
            return new CachedCategoriesRepository(inner, cache, settings, logger);
        });

        // Decorate Products Repository
        services.AddSingleton<IProductsRepository>(serviceProvider =>
        {
            var inner = serviceProvider.GetRequiredService<CosmosDbProductsRepository>();
            var cache = serviceProvider.GetRequiredService<IMemoryCache>();
            var settings = serviceProvider.GetRequiredService<IOptions<CacheSettings>>();
            var logger = serviceProvider.GetRequiredService<ILogger<CachedProductsRepository>>();
            return new CachedProductsRepository(inner, cache, settings, logger);
        });

        // Decorate Carousel Slides Repository
        services.AddSingleton<ICarouselSlidesRepository>(serviceProvider =>
        {
            var inner = serviceProvider.GetRequiredService<CosmosDbCarouselSlidesRepository>();
            var cache = serviceProvider.GetRequiredService<IMemoryCache>();
            var settings = serviceProvider.GetRequiredService<IOptions<CacheSettings>>();
            var logger = serviceProvider.GetRequiredService<ILogger<CachedCarouselSlidesRepository>>();
            return new CachedCarouselSlidesRepository(inner, cache, settings, logger);
        });

        return services;
    }
}
