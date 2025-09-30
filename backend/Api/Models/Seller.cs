namespace Api.Models;

public sealed record class Seller
{
    public Guid Id { get; init; }

    public string DisplayName { get; init; } = string.Empty;

    public string? CompanyName { get; init; }

    public string Email { get; init; } = string.Empty;
}
