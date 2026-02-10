namespace Api.Authentication;

/// <summary>
/// Centralized constants for authentication schemes, policies, and roles.
/// Eliminates magic strings across controllers and configuration.
/// </summary>
public static class AuthConstants
{
    /// <summary>
    /// Authentication scheme for self-issued guest JWT tokens.
    /// </summary>
    public const string GuestScheme = "GuestScheme";

    /// <summary>
    /// Policy that only allows requests with a valid guest token.
    /// </summary>
    public const string GuestOnlyPolicy = "GuestOnly";

    /// <summary>
    /// Role assigned to admin users via Entra ID app roles.
    /// </summary>
    public const string AdminRole = "admin";
}
