using Application.DTOs;

namespace Application.Services;

public interface IEmailService
{
    Task SendOrderConfirmationEmailAsync(
        OrderConfirmationEmailData emailData, 
        CancellationToken cancellationToken = default);
}