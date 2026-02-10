using Application.DTOs;
using Application.Exceptions;
using Domain.Entities;

namespace Application.Services;

public sealed class CartValidator
{
    public const int MaxCartItems = 50;
    public const int MaxQuantityPerItem = 99;

    public void ValidateAddToCartRequest(AddToCartRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ProductId))
        {
            throw new ArgumentException("ProductId is required", nameof(request.ProductId));
        }

        ValidateQuantity(request.Quantity, allowZero: false);
    }

    public void ValidateQuantity(int quantity, bool allowZero)
    {
        if (allowZero && quantity < 0)
        {
            throw new ArgumentException("Quantity cannot be negative", nameof(quantity));
        }

        if (!allowZero && quantity <= 0)
        {
            throw new ArgumentException("Quantity must be greater than 0", nameof(quantity));
        }

        if (quantity > MaxQuantityPerItem)
        {
            throw new ArgumentException($"Quantity cannot exceed {MaxQuantityPerItem}", nameof(quantity));
        }
    }

    public void ValidateCartLimits(Cart cart, CartItem? existingItem, string productId)
    {
        if (existingItem is null && cart.Items.Count >= MaxCartItems)
        {
            throw new InvalidOperationException($"Cart cannot contain more than {MaxCartItems} different items");
        }
    }

    public void ValidateStock(Product product, int requestedQuantity)
    {
        if (requestedQuantity > product.Stock)
        {
            throw new InsufficientStockException(requestedQuantity, product.Stock);
        }
    }

    public void ValidateCheckout(Cart cart)
    {
        if (cart.Status != CartStatus.Active)
        {
            throw new InvalidOperationException("Only active carts can be checked out");
        }

        if (cart.Items.Count == 0)
        {
            throw new InvalidOperationException("Cannot checkout an empty cart");
        }
    }
}