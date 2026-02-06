using System.Security.Claims;
using Api.Authentication;
using Microsoft.AspNetCore.Authorization;

namespace Api.Tests.Unit.Authentication;

public class GuestOnlyAuthorizationHandlerTests
{
    private readonly GuestOnlyAuthorizationHandler _handler = new();
    private readonly GuestOnlyRequirement _requirement = new();

    [Fact]
    public async Task HandleAsync_WithValidGuestToken_Succeeds()
    {
        // Arrange
        var claims = new[]
        {
            new Claim("guest", "true"),
            new Claim("guestSessionId", "session-123")
        };
        var context = CreateAuthorizationContext(claims);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task HandleAsync_WithNonGuestToken_Fails()
    {
        // Arrange
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "user-1") };
        var context = CreateAuthorizationContext(claims);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        Assert.True(context.HasFailed);
    }

    [Fact]
    public async Task HandleAsync_WithGuestTrueButNoSessionId_Fails()
    {
        // Arrange — guest=true but no session ID claims at all
        var claims = new[] { new Claim("guest", "true") };
        var context = CreateAuthorizationContext(claims);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        Assert.True(context.HasFailed);
    }

    [Fact]
    public async Task HandleAsync_WithNoClaims_Fails()
    {
        // Arrange
        var context = CreateAuthorizationContext([]);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        Assert.True(context.HasFailed);
    }

    [Fact]
    public async Task HandleAsync_WithGuestFalseValue_Fails()
    {
        // Arrange
        var claims = new[]
        {
            new Claim("guest", "false"),
            new Claim("guestSessionId", "session-123")
        };
        var context = CreateAuthorizationContext(claims);

        // Act
        await _handler.HandleAsync(context);

        // Assert
        Assert.True(context.HasFailed);
    }

    private AuthorizationHandlerContext CreateAuthorizationContext(Claim[] claims)
    {
        var identity = new ClaimsIdentity(claims, claims.Length > 0 ? "test" : null);
        var user = new ClaimsPrincipal(identity);
        return new AuthorizationHandlerContext(
            [_requirement], user, resource: null);
    }
}
