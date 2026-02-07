using Application.DTOs;
using Domain.Entities;

namespace Application.Services;

public interface IPaymentService
{
    Task<CreatePaymentIntentResponse> CreatePaymentIntentAsync(
        CreatePaymentIntentRequest request,
        string userId,
        CancellationToken cancellationToken = default);

    Task<Order> ProcessPaymentSuccessAsync(
        string paymentIntentId,
        string userId,
        string email,
        CancellationToken cancellationToken = default);

    Task<CartTotalValidationResult> ValidateCartTotalAsync(
        string userId,
        long requestedAmountInCents,
        decimal shippingCost,
        CancellationToken cancellationToken = default);
}