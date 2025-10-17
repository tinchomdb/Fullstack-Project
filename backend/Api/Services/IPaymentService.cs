using Api.Models.DTOs;

namespace Api.Services
{
    public interface IPaymentService
    {
        Task<CreatePaymentIntentResponse> CreatePaymentIntentAsync(
            CreatePaymentIntentRequest request);
    }
}
