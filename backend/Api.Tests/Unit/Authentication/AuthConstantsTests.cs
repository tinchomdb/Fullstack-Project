using Api.Authentication;

namespace Api.Tests.Unit.Authentication;

public class AuthConstantsTests
{
    [Fact]
    public void GuestScheme_HasExpectedValue()
    {
        Assert.Equal("GuestScheme", AuthConstants.GuestScheme);
    }

    [Fact]
    public void GuestOnlyPolicy_HasExpectedValue()
    {
        Assert.Equal("GuestOnly", AuthConstants.GuestOnlyPolicy);
    }

    [Fact]
    public void AdminRole_HasExpectedValue()
    {
        Assert.Equal("admin", AuthConstants.AdminRole);
    }

    [Fact]
    public void Constants_AreNotNullOrEmpty()
    {
        Assert.False(string.IsNullOrWhiteSpace(AuthConstants.GuestScheme));
        Assert.False(string.IsNullOrWhiteSpace(AuthConstants.GuestOnlyPolicy));
        Assert.False(string.IsNullOrWhiteSpace(AuthConstants.AdminRole));
    }
}
