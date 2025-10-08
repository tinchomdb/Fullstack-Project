using Api.Configuration;
using Api.Repositories;
using Api.Services;
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

builder.Services.Configure<CosmosDbSettings>(
    builder.Configuration.GetSection("CosmosDb"));

// Register CosmosClient as singleton
builder.Services.AddSingleton(serviceProvider =>
{
    var cosmosDbSettings = builder.Configuration.GetSection("CosmosDb").Get<CosmosDbSettings>();
    return new Microsoft.Azure.Cosmos.CosmosClient(
        cosmosDbSettings!.Account,
        cosmosDbSettings.Key,
        new Microsoft.Azure.Cosmos.CosmosClientOptions
        {
            SerializerOptions = new Microsoft.Azure.Cosmos.CosmosSerializationOptions
            {
                PropertyNamingPolicy = Microsoft.Azure.Cosmos.CosmosPropertyNamingPolicy.CamelCase
            }
        });
});

// Register individual repository implementations
builder.Services.AddSingleton<IProductsRepository, CosmosDbProductsRepository>();
builder.Services.AddSingleton<ICategoriesRepository, CosmosDbCategoriesRepository>();
builder.Services.AddSingleton<ICartsRepository, CosmosDbCartsRepository>();
builder.Services.AddSingleton<IOrdersRepository, CosmosDbOrdersRepository>();
builder.Services.AddSingleton<IUsersRepository, CosmosDbUsersRepository>();

// Register services
builder.Services.AddSingleton<CosmosDbInitializationService>();
builder.Services.AddSingleton<DataSeedingService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddAuthorization();

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

// Initialize Cosmos DB and seed data
try
{
    var initService = app.Services.GetRequiredService<CosmosDbInitializationService>();
    await initService.InitializeAsync();
    
    var seedService = app.Services.GetRequiredService<DataSeedingService>();
    await seedService.SeedDataAsync();
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "An error occurred while initializing the database");
    throw;
}

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

// HTTPS redirection is handled by Azure App Service in production
// Only use it in development to avoid warnings
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapControllers();

app.Run();
