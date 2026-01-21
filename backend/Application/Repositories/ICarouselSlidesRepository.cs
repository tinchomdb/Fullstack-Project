using Domain.Entities;

namespace Application.Repositories;

public interface ICarouselSlidesRepository
{
    Task<IReadOnlyList<CarouselSlide>> GetAllSlidesAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CarouselSlide>> GetActiveSlidesAsync(CancellationToken cancellationToken = default);

    Task<CarouselSlide?> GetSlideAsync(string slideId, CancellationToken cancellationToken = default);

    Task<CarouselSlide> CreateSlideAsync(CarouselSlide slide, CancellationToken cancellationToken = default);

    Task<CarouselSlide> UpdateSlideAsync(CarouselSlide slide, CancellationToken cancellationToken = default);

    Task DeleteSlideAsync(string slideId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CarouselSlide>> ReorderSlidesAsync(string[] slideIds, CancellationToken cancellationToken = default);
}