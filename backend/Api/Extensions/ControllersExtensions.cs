namespace Api.Extensions;

public static class ControllersExtensions
{
    public static IServiceCollection AddControllersWithOptions(this IServiceCollection services)
    {
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(
                    new System.Text.Json.Serialization.JsonStringEnumConverter());
                options.JsonSerializerOptions.PropertyNamingPolicy = 
                    System.Text.Json.JsonNamingPolicy.CamelCase;
            });

        return services;
    }
}
