using System.Security.Claims;

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
