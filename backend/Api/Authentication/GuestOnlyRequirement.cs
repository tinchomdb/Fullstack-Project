using Microsoft.AspNetCore.Authorization;

namespace Api.Authentication;

/// <summary>
/// Requirement for guest-only authorization policy.
/// </summary>
public sealed class GuestOnlyRequirement : IAuthorizationRequirement
{
}
