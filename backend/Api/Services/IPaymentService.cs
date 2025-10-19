using Api.Models;
using Api.Models.DTOs;

namespace Api.Services;

public interface IPaymentService
{
    Task<CreatePaymentIntentResponse> CreatePaymentIntentAsync(
        CreatePaymentIntentRequest request,
        string userId);

    Task<Order> ProcessPaymentSuccessAsync(
        string paymentIntentId,
        string userId,
        string email,
        CancellationToken cancellationToken = default);
}
