namespace Application.DTOs;

public sealed record RemoveFromCartRequest
{
    public string ProductId { get; init; } = string.Empty;
}
