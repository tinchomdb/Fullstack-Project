namespace Api.Services;

public interface IJwtTokenService
{
    /// <summary>
    /// Generates a JWT token for a guest user with a unique guest session ID.
    /// </summary>
    /// <returns>A signed JWT token string.</returns>
    string GenerateGuestToken();

    /// <summary>
    /// Validates a JWT token and extracts the guest session ID.
    /// </summary>
    /// <param name="token">The JWT token to validate.</param>
    /// <returns>The guest session ID if valid, null otherwise.</returns>
    string? ValidateAndExtractGuestId(string token);
}
