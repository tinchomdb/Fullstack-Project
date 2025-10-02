using Api.Configuration;
using Api.Repositories;
using Azure.Identity;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// Add Azure Key Vault configuration in Production
if (builder.Environment.IsProduction())
{
    var keyVaultEndpoint = builder.Configuration["KeyVault:Endpoint"];
    
    if (!string.IsNullOrEmpty(keyVaultEndpoint))
    {
        try
        {
            builder.Configuration.AddAzureKeyVault(
                new Uri(keyVaultEndpoint),
                new DefaultAzureCredential());
            
            builder.Logging.AddConsole().AddDebug();
            Console.WriteLine($"✅ Successfully connected to Azure Key Vault: {keyVaultEndpoint}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Warning: Could not connect to Key Vault: {ex.Message}");
            Console.WriteLine("Application will continue using configuration from App Settings as fallback.");
            // Application continues with App Settings configuration
            // This allows the app to start even if Key Vault is not properly configured
        }
    }
    else
    {
        Console.WriteLine("ℹ️ Key Vault endpoint not configured. Using App Settings for configuration.");
    }
}

var allowedOrigins = builder.Configuration.GetValue<string>("AllowedOrigins")?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? [];

// Configure Cosmos DB settings from configuration
builder.Services.Configure<CosmosDbSettings>(
    builder.Configuration.GetSection("CosmosDb"));

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IMarketplaceRepository, InMemoryMarketplaceRepository>();
// Enable CORS for local development (allow Angular dev server)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowConfiguredOrigins", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            // Fallback (dev)
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // In production enable HSTS
    app.UseHsts();
}

app.UseCors("AllowConfiguredOrigins");

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
