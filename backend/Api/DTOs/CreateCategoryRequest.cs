using System.ComponentModel.DataAnnotations;
using Domain.Entities;

namespace Api.DTOs;

public sealed record CreateCategoryRequest
{
    [Required]
    [MaxLength(255)]
    public required string Name { get; init; }

    [Required]
    [MaxLength(255)]
    public required string Slug { get; init; }

    [MaxLength(1000)]
    public string? Description { get; init; }

    [Url]
    [MaxLength(2048)]
    public string? Image { get; init; }

    public bool Featured { get; init; }

    public string? ParentCategoryId { get; init; }

    public Category ToEntity() => new()
    {
        Name = Name,
        Slug = Slug,
        Description = Description,
        Image = Image,
        Featured = Featured,
        ParentCategoryId = ParentCategoryId
    };
}
