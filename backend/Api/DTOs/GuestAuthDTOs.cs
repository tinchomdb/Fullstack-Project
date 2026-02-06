namespace Api.DTOs;

public sealed record GuestTokenResponse
{
    public required string Token { get; init; }
    public required string TokenType { get; init; }
}
