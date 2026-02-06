namespace Infrastructure.Configuration;

public sealed class CosmosDbSettings
{
    public string Account { get; set; } = string.Empty;
    public string Key { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
    public ContainerNames ContainerNames { get; set; } = new();
}