using Api.DTOs;
using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class GuestAuthController(
    IJwtTokenService jwtTokenService,
    ILogger<GuestAuthController> logger) : ControllerBase
{
    private readonly IJwtTokenService _jwtTokenService = jwtTokenService ?? throw new ArgumentNullException(nameof(jwtTokenService));
    private readonly ILogger<GuestAuthController> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    /// Issues a new JWT token for anonymous/guest users.
    /// Frontend should store this token (e.g., localStorage) and send it in Authorization header.
    /// </summary>
    /// <returns>A short-lived JWT token for guest access.</returns>
    [HttpPost("guest-token")]
    [ProducesResponseType(typeof(GuestTokenResponse), StatusCodes.Status200OK)]
    public ActionResult<GuestTokenResponse> GetGuestToken()
    {
        var token = _jwtTokenService.GenerateGuestToken();

        _logger.LogInformation("[GUEST_AUTH] Issued new guest token");

        return Ok(new GuestTokenResponse
        {
            Token = token,
            TokenType = "Bearer"
        });
    }
}
