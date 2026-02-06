using System.ComponentModel.DataAnnotations;

namespace Api.DTOs;

public sealed record CreateCarouselSlideRequest
{
    [Required]
    [Url(ErrorMessage = "ImageUrl must be a valid URL")]
    [MaxLength(2048, ErrorMessage = "ImageUrl cannot exceed 2048 characters")]
    public required string ImageUrl { get; init; }

    [Required]
    [MaxLength(255, ErrorMessage = "Alt text cannot exceed 255 characters")]
    public required string Alt { get; init; }

    [Range(1, int.MaxValue, ErrorMessage = "Order must be a positive number")]
    public int? Order { get; init; }

    public bool? IsActive { get; init; }
}
