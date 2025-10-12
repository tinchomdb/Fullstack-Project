using Api.Configuration;
using Api.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace Api.Repositories;

public sealed class CosmosDbCarouselSlidesRepository : ICarouselSlidesRepository
{
    private readonly Container _container;

    public CosmosDbCarouselSlidesRepository(
        CosmosClient cosmosClient,
        IOptions<CosmosDbSettings> cosmosDbSettings)
    {
        var settings = cosmosDbSettings.Value;
        var database = cosmosClient.GetDatabase(settings.DatabaseName);
        _container = database.GetContainer(settings.ContainersNames.CarouselSlides);
    }

    public async Task<IReadOnlyList<CarouselSlide>> GetAllSlidesAsync(
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.type = @type ORDER BY c[\"order\"] ASC")
            .WithParameter("@type", "CarouselSlide");

        var iterator = _container.GetItemQueryIterator<CarouselSlide>(query);
        var slides = new List<CarouselSlide>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            slides.AddRange(response);
        }

        return slides.AsReadOnly();
    }

    public async Task<IReadOnlyList<CarouselSlide>> GetActiveSlidesAsync(
        CancellationToken cancellationToken = default)
    {
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.type = @type AND c.isActive = @isActive ORDER BY c[\"order\"] ASC")
            .WithParameter("@type", "CarouselSlide")
            .WithParameter("@isActive", true);

        var iterator = _container.GetItemQueryIterator<CarouselSlide>(query);
        var slides = new List<CarouselSlide>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync(cancellationToken);
            slides.AddRange(response);
        }

        return slides.AsReadOnly();
    }

    public async Task<CarouselSlide?> GetSlideAsync(
        string slideId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _container.ReadItemAsync<CarouselSlide>(
                slideId,
                new PartitionKey("carousel-slides"),
                cancellationToken: cancellationToken);

            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<CarouselSlide> CreateSlideAsync(
        CarouselSlide slide,
        CancellationToken cancellationToken = default)
    {
        var slideToCreate = slide with 
        { 
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var response = await _container.CreateItemAsync(
            slideToCreate,
            new PartitionKey("carousel-slides"),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task<CarouselSlide> UpdateSlideAsync(
        CarouselSlide slide,
        CancellationToken cancellationToken = default)
    {
        var slideToUpdate = slide with { UpdatedAt = DateTime.UtcNow };

        var response = await _container.ReplaceItemAsync(
            slideToUpdate,
            slide.Id,
            new PartitionKey("carousel-slides"),
            cancellationToken: cancellationToken);

        return response.Resource;
    }

    public async Task DeleteSlideAsync(
        string slideId,
        CancellationToken cancellationToken = default)
    {
        await _container.DeleteItemAsync<CarouselSlide>(
            slideId,
            new PartitionKey("carousel-slides"),
            cancellationToken: cancellationToken);
    }

    public async Task<IReadOnlyList<CarouselSlide>> ReorderSlidesAsync(
        string[] slideIds,
        CancellationToken cancellationToken = default)
    {
        var reorderedSlides = new List<CarouselSlide>();

        for (int i = 0; i < slideIds.Length; i++)
        {
            var slideId = slideIds[i];
            var existingSlide = await GetSlideAsync(slideId, cancellationToken);
            
            if (existingSlide is not null)
            {
                var updatedSlide = existingSlide with 
                { 
                    Order = i + 1,
                    UpdatedAt = DateTime.UtcNow
                };

                var response = await _container.ReplaceItemAsync(
                    updatedSlide,
                    slideId,
                    new PartitionKey("carousel-slides"),
                    cancellationToken: cancellationToken);

                reorderedSlides.Add(response.Resource);
            }
        }

        return reorderedSlides.AsReadOnly();
    }
}