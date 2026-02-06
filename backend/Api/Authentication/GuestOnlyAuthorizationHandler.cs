using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace Api.Authentication;

/// <summary>
/// Authorization handler for guest-only endpoints.
/// Validates that the request contains a valid guest token with a session ID.
/// </summary>
public sealed class GuestOnlyAuthorizationHandler : AuthorizationHandler<GuestOnlyRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        GuestOnlyRequirement requirement)
    {
        // Check if the user has the guest claim set to true
        var isGuest = context.User.FindFirst("guest")?.Value == "true";

        if (!isGuest)
        {
            context.Fail();
            return Task.CompletedTask;
        }

        // Validate that guest session ID exists
        var guestSessionId = context.User.FindFirst("guestSessionId")?.Value
            ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? context.User.FindFirst("sub")?.Value;

        if (string.IsNullOrWhiteSpace(guestSessionId))
        {
            context.Fail();
            return Task.CompletedTask;
        }

        context.Succeed(requirement);
        return Task.CompletedTask;
    }
}
