using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class ProductQueryParameters : IValidatableObject
{
    [Range(0, double.MaxValue, ErrorMessage = "MinPrice must be greater than or equal to 0")]
    public decimal? MinPrice { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "MaxPrice must be greater than or equal to 0")]
    public decimal? MaxPrice { get; set; }

    public string? SortBy { get; set; } = "name";

    public string? SortDirection { get; set; } = "asc";

    [Range(1, int.MaxValue, ErrorMessage = "Page must be greater than or equal to 1")]
    public int Page { get; set; } = 1;

    [Range(1, 100, ErrorMessage = "PageSize must be between 1 and 100")]
    public int PageSize { get; set; } = 20;

    public string? CategoryId { get; set; }

    public string? SearchTerm { get; set; }

    public bool HasFilters => MinPrice.HasValue 
        || MaxPrice.HasValue 
        || !string.IsNullOrEmpty(CategoryId);

    public bool IsSearching => !string.IsNullOrWhiteSpace(SearchTerm);

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (MinPrice.HasValue && MaxPrice.HasValue && MinPrice > MaxPrice)
        {
            yield return new ValidationResult(
                "MinPrice must be less than or equal to MaxPrice",
                [nameof(MinPrice), nameof(MaxPrice)]);
        }
    }
}