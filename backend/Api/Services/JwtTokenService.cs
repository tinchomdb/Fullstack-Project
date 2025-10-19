using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Api.Configuration;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Api.Services;

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<JwtTokenService> _logger;
    private readonly SigningCredentials _signingCredentials;
    private readonly TokenValidationParameters _validationParameters;

    public JwtTokenService(
        IOptions<JwtSettings> jwtSettings,
        ILogger<JwtTokenService> logger)
    {
        _jwtSettings = jwtSettings?.Value ?? throw new ArgumentNullException(nameof(jwtSettings));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        if (string.IsNullOrWhiteSpace(_jwtSettings.Secret))
        {
            throw new InvalidOperationException("JWT Secret is not configured");
        }

        var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret);
        _signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(key),
            SecurityAlgorithms.HmacSha256);

        _validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = _jwtSettings.Issuer,
            ValidAudience = _jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ClockSkew = TimeSpan.FromMinutes(5)
        };
    }

    public string GenerateGuestToken()
    {
        var guestSessionId = Guid.NewGuid().ToString();
        var now = DateTime.UtcNow;
        var expires = now.AddDays(_jwtSettings.GuestTokenExpirationDays);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, guestSessionId),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, new DateTimeOffset(now).ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),
            new Claim("guest", "true"),
            new Claim("guestSessionId", guestSessionId)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: _signingCredentials);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        _logger.LogInformation(
            "[GUEST_JWT] Generated token for guest session {GuestSessionId}, expires {Expiration}",
            guestSessionId,
            expires);

        return tokenString;
    }

    public string? ValidateAndExtractGuestId(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, _validationParameters, out var validatedToken);

            // Ensure it's a guest token
            var isGuest = principal.FindFirst("guest")?.Value == "true";
            if (!isGuest)
            {
                _logger.LogWarning("[GUEST_JWT] Token is not a guest token");
                return null;
            }

            // Extract guest session ID
            var guestSessionId = principal.FindFirst("guestSessionId")?.Value
                ?? principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (string.IsNullOrEmpty(guestSessionId))
            {
                _logger.LogWarning("[GUEST_JWT] Guest session ID not found in token");
                return null;
            }

            _logger.LogDebug("[GUEST_JWT] Successfully validated token for guest session {GuestSessionId}", guestSessionId);
            return guestSessionId;
        }
        catch (SecurityTokenExpiredException ex)
        {
            _logger.LogDebug(ex, "[GUEST_JWT] Token expired");
            return null;
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning(ex, "[GUEST_JWT] Token validation failed");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[GUEST_JWT] Unexpected error validating token");
            return null;
        }
    }
}
