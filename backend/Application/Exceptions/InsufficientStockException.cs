namespace Application.Exceptions;

public sealed class InsufficientStockException(
    int requestedQuantity,
    int availableStock)
    : Exception($"Insufficient stock. Requested: {requestedQuantity}, Available: {availableStock}")
{
    public int RequestedQuantity { get; } = requestedQuantity;
    public int AvailableStock { get; } = availableStock;
}
