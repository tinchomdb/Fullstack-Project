using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Api.Extensions;

public static class ClaimsExtensions
{
    /// <summary>
    /// Gets the user ID from the claims principal.
    /// The user ID is typically stored in the 'sub' claim or 'nameidentifier' claim.
    /// </summary>
    public static string GetUserId(this ClaimsPrincipal user)
    {
        var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user.FindFirst("sub")?.Value
            ?? user.FindFirst("oid")?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            throw new InvalidOperationException("Unable to extract user ID from claims.");
        }

        return userId;
    }
}

/// <summary>
/// Extensions for working with guest sessions via HttpContext.
/// </summary>
public static class GuestSessionExtensions
{
    private const string GUEST_SESSION_COOKIE_NAME = "guestSessionId";

    /// <summary>
    /// Gets the guest session ID from the HTTP request cookies.
    /// </summary>
    public static string? GetGuestSessionId(this HttpContext context, ILogger? logger = null)
    {
        var hasCookie = context.Request.Cookies.TryGetValue(GUEST_SESSION_COOKIE_NAME, out var guestSessionId);
        
        if (logger != null && hasCookie)
        {
            logger.LogInformation("[GUEST_SESSION] Found cookie {SessionId}", guestSessionId);
        }
        
        return hasCookie && !string.IsNullOrWhiteSpace(guestSessionId) ? guestSessionId : null;
    }

    /// <summary>
    /// Sets a secure guest session cookie with HttpOnly, Secure, and SameSite flags (30-day expiry).
    /// </summary>
    public static void SetGuestSessionCookie(this HttpContext context, string guestSessionId, ILogger? logger = null)
    {
        logger?.LogInformation("[GUEST_SESSION] Setting cookie {SessionId}", guestSessionId);
        
        context.Response.Cookies.Append(
            GUEST_SESSION_COOKIE_NAME,
            guestSessionId,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = context.Request.IsHttps,
                SameSite = SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddDays(30),
                IsEssential = true
            });
    }

    /// <summary>
    /// Deletes the guest session cookie.
    /// </summary>
    public static void DeleteGuestSessionCookie(this HttpContext context, ILogger? logger = null)
    {
        logger?.LogInformation("[GUEST_SESSION] Deleting cookie");
        context.Response.Cookies.Delete(GUEST_SESSION_COOKIE_NAME);
    }

    /// <summary>
    /// Gets current user context (authenticated user or guest session).
    /// </summary>
    public static (string? userId, bool isAuthenticated) GetCurrentUserContext(this HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            try
            {
                return (context.User.GetUserId(), true);
            }
            catch
            {
                return (null, false);
            }
        }

        var guestSessionId = context.GetGuestSessionId();
        return (!string.IsNullOrEmpty(guestSessionId), !string.IsNullOrEmpty(guestSessionId)) switch
        {
            (true, true) => (guestSessionId, false),
            _ => (null, false)
        };
    }
}
