using Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Configure services
builder.AddKeyVaultConfiguration();
builder.Services.AddCosmosDb(builder.Configuration);
builder.Services.AddCaching(builder.Configuration);
builder.Services.DecorateRepositoriesWithCaching();
builder.Services.AddJwtTokenService(builder.Configuration);
builder.Services.AddAuthenticationAndAuthorization(builder.Configuration);
builder.Services.AddRateLimiting();
builder.Services.AddCorsPolicy(builder.Configuration);
builder.Services.AddSwagger();
builder.Services.AddControllersWithOptions();
builder.Services.AddStripePayment(builder.Configuration);
builder.Services.AddEmailService(builder.Configuration);

var app = builder.Build();

// Initialize database
await app.InitializeDatabaseAsync();

// Configure middleware pipeline
app.ConfigureMiddleware();

app.Run();

/// <summary>
/// Public Program class for WebApplicationFactory in tests
/// </summary>
public partial class Program { }

