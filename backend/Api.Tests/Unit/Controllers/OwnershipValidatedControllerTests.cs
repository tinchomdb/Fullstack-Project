using System.Security.Claims;
using Api.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Api.Tests.Unit.Controllers;

/// <summary>
/// Concrete subclass for testing the abstract OwnershipValidatedController.
/// </summary>
internal sealed class TestOwnershipController : OwnershipValidatedController
{
    public ActionResult? TestValidateOwnership(string resourceUserId)
    {
        return ValidateOwnership(resourceUserId);
    }
}

public class OwnershipValidatedControllerTests
{
    private readonly TestOwnershipController _controller;

    public OwnershipValidatedControllerTests()
    {
        _controller = new TestOwnershipController();
    }

    [Fact]
    public void ValidateOwnership_WhenUserMatchesResource_ReturnsNull()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");

        // Act
        var result = _controller.TestValidateOwnership("user-1");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void ValidateOwnership_WhenUserDoesNotMatchResource_ReturnsForbid()
    {
        // Arrange
        SetupAuthenticatedUser("user-1");

        // Act
        var result = _controller.TestValidateOwnership("user-2");

        // Assert
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public void ValidateOwnership_WhenUnauthenticated_ReturnsForbid()
    {
        // Arrange — no claims at all
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };

        // Act
        var result = _controller.TestValidateOwnership("user-1");

        // Assert
        Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public void ValidateOwnership_IsCaseSensitive()
    {
        // Arrange
        SetupAuthenticatedUser("User-1");

        // Act – different casing
        var result = _controller.TestValidateOwnership("user-1");

        // Assert
        Assert.IsType<ForbidResult>(result);
    }

    private void SetupAuthenticatedUser(string userId)
    {
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
        var identity = new ClaimsIdentity(claims, "Bearer");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }
}
