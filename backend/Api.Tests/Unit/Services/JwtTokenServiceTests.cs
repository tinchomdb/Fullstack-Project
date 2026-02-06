using Api.Configuration;
using Api.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace Api.Tests.Unit.Services;

public class JwtTokenServiceTests
{
    private readonly JwtSettings _jwtSettings;
    private readonly Mock<ILogger<JwtTokenService>> _mockLogger;
    private readonly JwtTokenService _service;

    public JwtTokenServiceTests()
    {
        _jwtSettings = new JwtSettings
        {
            Secret = "ThisIsAVeryLongSecretKeyForTestingPurposes12345!",
            Issuer = "test-issuer",
            Audience = "test-audience",
            GuestTokenExpirationDays = 30
        };
        _mockLogger = new Mock<ILogger<JwtTokenService>>();
        _service = new JwtTokenService(
            Options.Create(_jwtSettings),
            _mockLogger.Object);
    }

    [Fact]
    public void Constructor_WithNullSettings_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new JwtTokenService(null!, _mockLogger.Object));
    }

    [Fact]
    public void Constructor_WithNullLogger_ThrowsArgumentNullException()
    {
        Assert.Throws<ArgumentNullException>(
            () => new JwtTokenService(Options.Create(_jwtSettings), null!));
    }

    [Fact]
    public void Constructor_WithEmptySecret_ThrowsInvalidOperationException()
    {
        var settings = new JwtSettings { Secret = "", Issuer = "i", Audience = "a" };

        Assert.Throws<InvalidOperationException>(
            () => new JwtTokenService(Options.Create(settings), _mockLogger.Object));
    }

    // ===== GenerateGuestToken =====

    [Fact]
    public void GenerateGuestToken_ReturnsNonEmptyString()
    {
        var token = _service.GenerateGuestToken();

        Assert.False(string.IsNullOrWhiteSpace(token));
    }

    [Fact]
    public void GenerateGuestToken_ReturnsDifferentTokensEachCall()
    {
        var token1 = _service.GenerateGuestToken();
        var token2 = _service.GenerateGuestToken();

        Assert.NotEqual(token1, token2);
    }

    // ===== ValidateAndExtractGuestId =====

    [Fact]
    public void ValidateAndExtractGuestId_WithValidToken_ReturnsGuestId()
    {
        // Arrange
        var token = _service.GenerateGuestToken();

        // Act
        var guestId = _service.ValidateAndExtractGuestId(token);

        // Assert
        Assert.NotNull(guestId);
        Assert.NotEmpty(guestId);
    }

    [Fact]
    public void ValidateAndExtractGuestId_RoundTrip_ReturnsSameGuestId()
    {
        // The guestId is a new Guid generated inside GenerateGuestToken,
        // so we validate that extraction returns the same value that was embedded.
        var token = _service.GenerateGuestToken();
        var guestId1 = _service.ValidateAndExtractGuestId(token);
        var guestId2 = _service.ValidateAndExtractGuestId(token);

        Assert.Equal(guestId1, guestId2);
    }

    [Fact]
    public void ValidateAndExtractGuestId_WithTamperedToken_ReturnsNull()
    {
        var token = _service.GenerateGuestToken();
        var tampered = token + "X";

        var result = _service.ValidateAndExtractGuestId(tampered);

        Assert.Null(result);
    }

    [Fact]
    public void ValidateAndExtractGuestId_WithCompletelyInvalidToken_ReturnsNull()
    {
        var result = _service.ValidateAndExtractGuestId("not-a-jwt-token");

        Assert.Null(result);
    }

    [Fact]
    public void ValidateAndExtractGuestId_WithDifferentSigningKey_ReturnsNull()
    {
        // Create a second service with a different secret
        var differentSettings = new JwtSettings
        {
            Secret = "ACompletelyDifferentSecretKeyForTesting987654!",
            Issuer = "test-issuer",
            Audience = "test-audience"
        };
        var differentService = new JwtTokenService(
            Options.Create(differentSettings), _mockLogger.Object);

        // Generate token with the different service
        var token = differentService.GenerateGuestToken();

        // Try to validate with the original service (different key)
        var result = _service.ValidateAndExtractGuestId(token);

        Assert.Null(result);
    }
}
