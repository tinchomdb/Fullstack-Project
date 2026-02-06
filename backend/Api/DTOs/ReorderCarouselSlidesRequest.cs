using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public sealed record ReorderCarouselSlidesRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one slide ID is required")]
    public required string[] SlideIds { get; init; }
}
