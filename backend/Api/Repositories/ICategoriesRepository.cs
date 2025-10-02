using Api.Models;

namespace Api.Repositories;

public interface ICategoriesRepository
{
    Task<IReadOnlyList<Category>> GetCategoriesAsync(CancellationToken cancellationToken = default);

    Task<Category?> GetCategoryAsync(string categoryId, CancellationToken cancellationToken = default);

    Task<Category> CreateCategoryAsync(Category category, CancellationToken cancellationToken = default);
}
