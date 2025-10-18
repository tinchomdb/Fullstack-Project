using Azure;
using Azure.Communication.Email;
using Api.Configuration;
using Api.Models.DTOs;
using Microsoft.Extensions.Options;
using System.Text;

namespace Api.Services;

public sealed class AzureEmailService : IEmailService
{
    private readonly EmailClient? _emailClient;
    private readonly EmailSettings _settings;
    private readonly ILogger<AzureEmailService> _logger;

    public AzureEmailService(
        IOptions<EmailSettings> settings,
        ILogger<AzureEmailService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        
        // Only create EmailClient if email sending is enabled and connection string is configured
        if (_settings.EnableEmailSending && !string.IsNullOrEmpty(_settings.ConnectionString))
        {
            _emailClient = new EmailClient(_settings.ConnectionString);
        }
        else
        {
            _emailClient = null;
        }
    }

    public async Task SendOrderConfirmationEmailAsync(
        OrderConfirmationEmailData emailData,
        CancellationToken cancellationToken = default)
    {
        if (!_settings.EnableEmailSending)
        {
            _logger.LogWarning("Email sending is disabled. Skipping order confirmation email for order {OrderId}", 
                emailData.OrderId);
            return;
        }

        if (_emailClient == null)
        {
            _logger.LogWarning("Email client is not configured (missing connection string). Skipping order confirmation email for order {OrderId}", 
                emailData.OrderId);
            return;
        }

        try
        {
            var emailContent = BuildOrderConfirmationEmailContent(emailData);

            var emailMessage = new EmailMessage(
                senderAddress: _settings.SenderAddress,
                content: emailContent,
                recipients: new EmailRecipients(new List<EmailAddress>
                {
                    new EmailAddress(emailData.RecipientEmail, emailData.RecipientName)
                }));

            EmailSendOperation emailSendOperation = await _emailClient.SendAsync(
                WaitUntil.Started,
                emailMessage,
                cancellationToken);

            _logger.LogInformation(
                "Order confirmation email sent for order {OrderId} to {Email}. MessageId: {MessageId}",
                emailData.OrderId,
                emailData.RecipientEmail,
                emailSendOperation.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send order confirmation email for order {OrderId} to {Email}",
                emailData.OrderId,
                emailData.RecipientEmail);
            
            // Don't throw - email failure shouldn't break the order process
        }
    }

    private EmailContent BuildOrderConfirmationEmailContent(OrderConfirmationEmailData data)
    {
        var subject = $"Order Confirmation - #{data.OrderId}";
        
        var htmlBody = BuildHtmlEmailBody(data);
        var plainTextBody = BuildPlainTextEmailBody(data);

        return new EmailContent(subject)
        {
            PlainText = plainTextBody,
            Html = htmlBody
        };
    }

    private static string BuildHtmlEmailBody(OrderConfirmationEmailData data)
    {
        var sb = new StringBuilder();
        
        sb.AppendLine("<!DOCTYPE html>");
        sb.AppendLine("<html>");
        sb.AppendLine("<head>");
        sb.AppendLine("    <style>");
        sb.AppendLine("        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }");
        sb.AppendLine("        .container { max-width: 600px; margin: 0 auto; padding: 20px; }");
        sb.AppendLine("        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }");
        sb.AppendLine("        .content { padding: 20px; background-color: #f9f9f9; }");
        sb.AppendLine("        .order-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }");
        sb.AppendLine("        .item { border-bottom: 1px solid #eee; padding: 10px 0; }");
        sb.AppendLine("        .item:last-child { border-bottom: none; }");
        sb.AppendLine("        .totals { margin-top: 20px; padding-top: 20px; border-top: 2px solid #4CAF50; }");
        sb.AppendLine("        .total-row { display: flex; justify-content: space-between; margin: 5px 0; }");
        sb.AppendLine("        .grand-total { font-size: 1.2em; font-weight: bold; color: #4CAF50; }");
        sb.AppendLine("        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }");
        sb.AppendLine("    </style>");
        sb.AppendLine("</head>");
        sb.AppendLine("<body>");
        sb.AppendLine("    <div class='container'>");
        sb.AppendLine("        <div class='header'>");
        sb.AppendLine($"            <h1>Thank You, {data.RecipientName}!</h1>");
        sb.AppendLine("            <p>Your order has been confirmed</p>");
        sb.AppendLine("        </div>");
        sb.AppendLine("        <div class='content'>");
        sb.AppendLine($"            <p>Order Number: <strong>#{data.OrderId}</strong></p>");
        sb.AppendLine($"            <p>Order Date: {data.OrderDate:MMMM dd, yyyy 'at' h:mm tt}</p>");
        sb.AppendLine("            <div class='order-details'>");
        sb.AppendLine("                <h2>Order Items</h2>");

        foreach (var item in data.Items)
        {
            sb.AppendLine("                <div class='item'>");
            sb.AppendLine($"                    <div><strong>{item.ProductName}</strong></div>");
            sb.AppendLine($"                    <div>Quantity: {item.Quantity} × ${item.Price:F2} = ${item.LineTotal:F2}</div>");
            sb.AppendLine("                </div>");
        }

        sb.AppendLine("                <div class='totals'>");
        sb.AppendLine("                    <div class='total-row'>");
        sb.AppendLine($"                        <span>Subtotal:</span>");
        sb.AppendLine($"                        <span>${data.Subtotal:F2}</span>");
        sb.AppendLine("                    </div>");
        sb.AppendLine("                    <div class='total-row'>");
        sb.AppendLine($"                        <span>Shipping:</span>");
        sb.AppendLine($"                        <span>${data.ShippingCost:F2}</span>");
        sb.AppendLine("                    </div>");
        sb.AppendLine("                    <div class='total-row grand-total'>");
        sb.AppendLine($"                        <span>Total:</span>");
        sb.AppendLine($"                        <span>${data.Total:F2}</span>");
        sb.AppendLine("                    </div>");
        sb.AppendLine("                </div>");
        sb.AppendLine("            </div>");
        sb.AppendLine("            <p>We'll send you a shipping confirmation email as soon as your order ships.</p>");
        sb.AppendLine("        </div>");
        sb.AppendLine("        <div class='footer'>");
        sb.AppendLine("            <p>Thank you for shopping with us!</p>");
        sb.AppendLine("            <p>If you have any questions, please don't hesitate to contact us.</p>");
        sb.AppendLine("        </div>");
        sb.AppendLine("    </div>");
        sb.AppendLine("</body>");
        sb.AppendLine("</html>");

        return sb.ToString();
    }

    private static string BuildPlainTextEmailBody(OrderConfirmationEmailData data)
    {
        var sb = new StringBuilder();
        
        sb.AppendLine($"Thank You, {data.RecipientName}!");
        sb.AppendLine();
        sb.AppendLine("Your order has been confirmed");
        sb.AppendLine();
        sb.AppendLine($"Order Number: #{data.OrderId}");
        sb.AppendLine($"Order Date: {data.OrderDate:MMMM dd, yyyy 'at' h:mm tt}");
        sb.AppendLine();
        sb.AppendLine("ORDER ITEMS");
        sb.AppendLine("===========");
        
        foreach (var item in data.Items)
        {
            sb.AppendLine($"{item.ProductName}");
            sb.AppendLine($"Quantity: {item.Quantity} × ${item.Price:F2} = ${item.LineTotal:F2}");
            sb.AppendLine();
        }

        sb.AppendLine("TOTALS");
        sb.AppendLine("======");
        sb.AppendLine($"Subtotal: ${data.Subtotal:F2}");
        sb.AppendLine($"Shipping: ${data.ShippingCost:F2}");
        sb.AppendLine($"Total: ${data.Total:F2}");
        sb.AppendLine();
        sb.AppendLine("We'll send you a shipping confirmation email as soon as your order ships.");
        sb.AppendLine();
        sb.AppendLine("Thank you for shopping with us!");
        sb.AppendLine("If you have any questions, please don't hesitate to contact us.");

        return sb.ToString();
    }
}
