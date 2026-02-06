using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Api.Extensions;

/// <summary>
/// Extensions for working with guest sessions via JWT tokens.
/// </summary>
public static class GuestSessionExtensions
{
    /// <summary>
    /// Gets the guest session ID from the JWT token claims.
    /// </summary>
    public static string? GetGuestSessionId(this HttpContext context, ILogger? logger = null)
    {
        var user = context.User;

        // Check if this is a guest token by looking for the guest claim
        var isGuest = user?.FindFirst("guest")?.Value == "true";

        if (!isGuest)
        {
            logger?.LogDebug("[GUEST_SESSION] No guest token found in request");
            return null;
        }

        // Extract guest session ID from claims
        var guestSessionId = user?.FindFirst("guestSessionId")?.Value
            ?? user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user?.FindFirst("sub")?.Value;

        if (logger != null && !string.IsNullOrEmpty(guestSessionId))
        {
            logger.LogDebug("[GUEST_SESSION] Found guest session ID from JWT: {SessionId}", guestSessionId);
        }

        return !string.IsNullOrWhiteSpace(guestSessionId) ? guestSessionId : null;
    }

    /// <summary>
    /// Gets current user context (authenticated user or guest session).
    /// </summary>
    public static (string? userId, bool isAuthenticated) GetCurrentUserContext(this HttpContext context)
    {
        var user = context.User;

        // Check if this is a guest token
        var isGuest = user?.FindFirst("guest")?.Value == "true";
        if (isGuest)
        {
            var guestSessionId = context.GetGuestSessionId();
            return (!string.IsNullOrEmpty(guestSessionId), false) switch
            {
                (true, false) => (guestSessionId, false),
                _ => (null, false)
            };
        }

        // Check if this is an authenticated user (MSAL token)
        if (user?.Identity?.IsAuthenticated == true)
        {
            try
            {
                return (user.GetUserId(), true);
            }
            catch (InvalidOperationException)
            {
                return (null, false);
            }
        }

        return (null, false);
    }

    /// <summary>
    /// Checks if the current request has a valid guest token.
    /// </summary>
    public static bool HasGuestToken(this HttpContext context)
    {
        return !string.IsNullOrEmpty(context.GetGuestSessionId());
    }
}
