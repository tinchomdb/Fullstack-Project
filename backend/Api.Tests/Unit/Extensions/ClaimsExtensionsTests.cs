using System.Security.Claims;
using Api.Extensions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;

namespace Api.Tests.Unit.Extensions;

public class ClaimsExtensionsTests
{
    // ===== GetUserId =====

    [Fact]
    public void GetUserId_WithNameIdentifierClaim_ReturnsUserId()
    {
        // Arrange
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "user-123") };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));

        // Act
        var userId = principal.GetUserId();

        // Assert
        Assert.Equal("user-123", userId);
    }

    [Fact]
    public void GetUserId_WithSubClaim_ReturnsUserId()
    {
        // Arrange
        var claims = new[] { new Claim("sub", "user-456") };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));

        // Act
        var userId = principal.GetUserId();

        // Assert
        Assert.Equal("user-456", userId);
    }

    [Fact]
    public void GetUserId_WithOidClaim_ReturnsUserId()
    {
        // Arrange
        var claims = new[] { new Claim("oid", "user-789") };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));

        // Act
        var userId = principal.GetUserId();

        // Assert
        Assert.Equal("user-789", userId);
    }

    [Fact]
    public void GetUserId_WithNoClaims_ThrowsInvalidOperationException()
    {
        // Arrange
        var principal = new ClaimsPrincipal(new ClaimsIdentity());

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => principal.GetUserId());
    }

    [Fact]
    public void GetUserId_PrioritizesNameIdentifierOverSub()
    {
        // Arrange
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "primary-id"),
            new Claim("sub", "secondary-id")
        };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));

        // Act
        var userId = principal.GetUserId();

        // Assert
        Assert.Equal("primary-id", userId);
    }

    // ===== GetGuestSessionId =====

    [Fact]
    public void GetGuestSessionId_WithGuestToken_ReturnsSessionId()
    {
        // Arrange
        var context = CreateHttpContextWithClaims(
            new Claim("guest", "true"),
            new Claim("guestSessionId", "guest-session-abc"));

        // Act
        var sessionId = context.GetGuestSessionId();

        // Assert
        Assert.Equal("guest-session-abc", sessionId);
    }

    [Fact]
    public void GetGuestSessionId_WithNonGuestToken_ReturnsNull()
    {
        // Arrange
        var context = CreateHttpContextWithClaims(
            new Claim(ClaimTypes.NameIdentifier, "user-1"));

        // Act
        var sessionId = context.GetGuestSessionId();

        // Assert
        Assert.Null(sessionId);
    }

    [Fact]
    public void GetGuestSessionId_WithGuestTrueButNoSessionId_ReturnsNull()
    {
        // Arrange — guest=true but no guestSessionId, no sub, no nameidentifier
        var context = CreateHttpContextWithClaims(new Claim("guest", "true"));

        // Act
        var sessionId = context.GetGuestSessionId();

        // Assert
        Assert.Null(sessionId);
    }

    [Fact]
    public void GetGuestSessionId_FallsBackToSubClaim()
    {
        // Arrange
        var context = CreateHttpContextWithClaims(
            new Claim("guest", "true"),
            new Claim(ClaimTypes.NameIdentifier, "fallback-id"));

        // Act
        var sessionId = context.GetGuestSessionId();

        // Assert
        Assert.Equal("fallback-id", sessionId);
    }

    // ===== GetCurrentUserContext =====

    [Fact]
    public void GetCurrentUserContext_WithAuthenticatedUser_ReturnsUserIdAndTrue()
    {
        // Arrange
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "user-1") };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var context = new DefaultHttpContext { User = new ClaimsPrincipal(identity) };

        // Act
        var (userId, isAuthenticated) = context.GetCurrentUserContext();

        // Assert
        Assert.Equal("user-1", userId);
        Assert.True(isAuthenticated);
    }

    [Fact]
    public void GetCurrentUserContext_WithGuestToken_ReturnsGuestIdAndFalse()
    {
        // Arrange
        var context = CreateHttpContextWithClaims(
            new Claim("guest", "true"),
            new Claim("guestSessionId", "guest-abc"));

        // Act
        var (userId, isAuthenticated) = context.GetCurrentUserContext();

        // Assert
        Assert.Equal("guest-abc", userId);
        Assert.False(isAuthenticated);
    }

    [Fact]
    public void GetCurrentUserContext_WithNoAuth_ReturnsNullAndFalse()
    {
        // Arrange
        var context = new DefaultHttpContext();

        // Act
        var (userId, isAuthenticated) = context.GetCurrentUserContext();

        // Assert
        Assert.Null(userId);
        Assert.False(isAuthenticated);
    }

    // ===== HasGuestToken =====

    [Fact]
    public void HasGuestToken_WithValidGuestToken_ReturnsTrue()
    {
        // Arrange
        var context = CreateHttpContextWithClaims(
            new Claim("guest", "true"),
            new Claim("guestSessionId", "guest-1"));

        // Act & Assert
        Assert.True(context.HasGuestToken());
    }

    [Fact]
    public void HasGuestToken_WithNoGuestToken_ReturnsFalse()
    {
        // Arrange
        var context = new DefaultHttpContext();

        // Act & Assert
        Assert.False(context.HasGuestToken());
    }

    // ===== Helper =====

    private static DefaultHttpContext CreateHttpContextWithClaims(params Claim[] claims)
    {
        var identity = new ClaimsIdentity(claims, "test");
        return new DefaultHttpContext
        {
            User = new ClaimsPrincipal(identity)
        };
    }
}
