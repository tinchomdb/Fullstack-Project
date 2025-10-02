using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Api.Configuration;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController(
    IWebHostEnvironment environment,
    IOptions<CosmosDbSettings> cosmosDbSettings) : ControllerBase
{
    private readonly IWebHostEnvironment _environment = environment;
    private readonly CosmosDbSettings _cosmosDbSettings = cosmosDbSettings.Value;

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            Environment = _environment.EnvironmentName,
            IsProduction = _environment.IsProduction(),
            IsDevelopment = _environment.IsDevelopment(),
            HasCosmosAccount = !string.IsNullOrEmpty(_cosmosDbSettings.Account),
            HasCosmosKey = !string.IsNullOrEmpty(_cosmosDbSettings.Key),
            DatabaseName = _cosmosDbSettings.DatabaseName,
            // Don't expose actual credentials - just check if they're configured
            ConfigurationStatus = !string.IsNullOrEmpty(_cosmosDbSettings.Account) && 
                                !string.IsNullOrEmpty(_cosmosDbSettings.Key) 
                                ? "Fully Configured" 
                                : "Missing Credentials"
        });
    }
}
