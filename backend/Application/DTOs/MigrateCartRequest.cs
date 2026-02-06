namespace Application.DTOs;

public sealed record MigrateCartRequest
{
    public string? GuestSessionId { get; init; }
}
