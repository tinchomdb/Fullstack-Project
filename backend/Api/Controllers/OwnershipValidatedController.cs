using Api.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

/// <summary>
/// Base controller for API endpoints that require ownership validation.
/// Provides a helper method to validate that the authenticated user matches a resource owner.
/// </summary>
public abstract class OwnershipValidatedController : ControllerBase
{
    /// <summary>
    /// Validates that the authenticated user owns the specified resource.
    /// Returns Forbid() if validation fails, null if successful.
    /// </summary>
    /// <param name="resourceUserId">The user ID of the resource owner.</param>
    /// <returns>Forbid() ActionResult if unauthorized, null if authorized.</returns>
    /// <exception cref="InvalidOperationException">
    /// Thrown if user is not authenticated (User.Identity?.IsAuthenticated is false).
    /// </exception>
    protected ActionResult? ValidateOwnership(string resourceUserId)
    {
        try
        {
            var authenticatedUserId = User.GetUserId();

            if (!string.Equals(resourceUserId, authenticatedUserId, StringComparison.Ordinal))
            {
                return Forbid();
            }

            return null;  // Validation succeeded
        }
        catch (InvalidOperationException)
        {
            // User.GetUserId() throws if user claims can't be extracted
            return Forbid();
        }
    }
}
