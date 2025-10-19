using Api.Controllers;
using Api.Models;
using Api.Models.DTOs;

namespace Api.Services;

public interface ICartService
{
    Task<CartResponse> GetActiveCartAsync(string userId, CancellationToken cancellationToken = default);
    
    Task<CartResponse> AddItemToCartAsync(string userId, AddToCartRequest request, CancellationToken cancellationToken = default);
    
    Task<CartResponse> UpdateCartItemAsync(string userId, UpdateCartItemRequest request, CancellationToken cancellationToken = default);
    
    Task<CartResponse> RemoveItemFromCartAsync(string userId, string productId, CancellationToken cancellationToken = default);
    
    Task<CartResponse> ClearCartAsync(string userId, CancellationToken cancellationToken = default);
    
    Task<CartValidationResponse> ValidateCartForCheckoutAsync(string userId, CancellationToken cancellationToken = default);
    
    Task<Order> CheckoutCartAsync(string userId, CancellationToken cancellationToken = default);
    
    Task MigrateGuestCartAsync(string guestId, string userId, CancellationToken cancellationToken = default);
}
