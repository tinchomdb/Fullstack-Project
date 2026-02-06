namespace Domain.Entities;

public sealed record class ShippingAddress
{
    public string Id { get; init; } = Guid.NewGuid().ToString();

    public string FullName { get; init; } = string.Empty;

    public string AddressLine1 { get; init; } = string.Empty;

    public string? AddressLine2 { get; init; }

    public string City { get; init; } = string.Empty;

    public string StateOrProvince { get; init; } = string.Empty;

    public string PostalCode { get; init; } = string.Empty;

    public string Country { get; init; } = string.Empty;

    public string? PhoneNumber { get; init; }

    public bool IsDefault { get; init; }
}
