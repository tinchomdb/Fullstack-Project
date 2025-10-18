using Api.Models.DTOs;

namespace Api.Services;

public interface IEmailService
{
    Task SendOrderConfirmationEmailAsync(
        OrderConfirmationEmailData emailData, 
        CancellationToken cancellationToken = default);
}
