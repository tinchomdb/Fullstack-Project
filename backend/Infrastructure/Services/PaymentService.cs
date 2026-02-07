using Application.DTOs;
using Application.Repositories;
using Application.Services;
using Domain.Entities;
using Microsoft.Extensions.Logging;
using Stripe;

namespace Infrastructure.Services;

public sealed class PaymentService(
    ICartService cartService,
    IOrdersRepository ordersRepository,
    IUsersRepository usersRepository,
    IEmailService emailService,
    ILogger<PaymentService> logger) : IPaymentService
{
    private static readonly HashSet<decimal> ValidShippingCosts = [5.99m, 12.99m, 24.99m];

    private readonly ICartService _cartService = cartService ?? throw new ArgumentNullException(nameof(cartService));
    private readonly IOrdersRepository _ordersRepository = ordersRepository ?? throw new ArgumentNullException(nameof(ordersRepository));
    private readonly IUsersRepository _usersRepository = usersRepository ?? throw new ArgumentNullException(nameof(usersRepository));
    private readonly IEmailService _emailService = emailService ?? throw new ArgumentNullException(nameof(emailService));
    private readonly ILogger<PaymentService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<CartTotalValidationResult> ValidateCartTotalAsync(
        string userId,
        long requestedAmountInCents,
        decimal shippingCost,
        CancellationToken cancellationToken = default)
    {
        try
        {
            if (!ValidShippingCosts.Contains(shippingCost))
            {
                return CartTotalValidationResult.Failure(
                    $"Invalid shipping cost: {shippingCost}. Valid options are: {string.Join(", ", ValidShippingCosts)}.");
            }

            var cart = await _cartService.GetActiveCartAsync(userId, cancellationToken);

            if (cart.Items.Count == 0)
            {
                return CartTotalValidationResult.Failure("Cart is empty. Please add items before checkout.");
            }

            var subtotal = cart.Total;
            var totalWithShipping = subtotal + shippingCost;
            var cartTotalInCents = (long)Math.Round(totalWithShipping * 100);

            if (requestedAmountInCents != cartTotalInCents)
            {
                _logger.LogWarning(
                    "Payment amount mismatch for user {UserId}: requested {Requested} cents, cart total {CartTotal} cents",
                    userId, requestedAmountInCents, cartTotalInCents);
                return CartTotalValidationResult.Failure(
                    $"Amount mismatch. Expected {cartTotalInCents} cents based on cart total.");
            }

            return CartTotalValidationResult.Success();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Cart validation failed for user {UserId}", userId);
            return CartTotalValidationResult.Failure("No active cart found. Please add items before checkout.");
        }
    }

    public async Task<CreatePaymentIntentResponse> CreatePaymentIntentAsync(
        CreatePaymentIntentRequest request,
        string userId,
        CancellationToken cancellationToken = default)
    {
        var service = new PaymentIntentService();

        var metadata = new Dictionary<string, string>
        {
            { "email", request.Email },
            { "created_at", DateTime.UtcNow.ToString("O") },
            { "user_id", userId },
            { "shipping_cost", request.ShippingCost.ToString("F2") }
        };

        if (!string.IsNullOrWhiteSpace(request.CartId))
        {
            metadata["cart_id"] = request.CartId;
        }

        var options = new PaymentIntentCreateOptions
        {
            Amount = request.Amount,
            Currency = "usd",
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true,
            },
            Metadata = metadata
        };

        var paymentIntent = await service.CreateAsync(options);

        return new CreatePaymentIntentResponse
        {
            ClientSecret = paymentIntent.ClientSecret,
            Amount = paymentIntent.Amount,
            PaymentIntentId = paymentIntent.Id
        };
    }

    public async Task<Order> ProcessPaymentSuccessAsync(
        string paymentIntentId,
        string userId,
        string email,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(paymentIntentId) || string.IsNullOrWhiteSpace(userId))
        {
            throw new InvalidOperationException(
                "Payment intent ID and user ID are required to process payment success");
        }

        _logger.LogInformation(
            "Processing successful payment for user {UserId}, payment {PaymentIntentId}",
            userId, paymentIntentId);

        try
        {
            // Idempotency check: if order already exists for this payment, return it
            var existingOrder = await _ordersRepository.GetOrderByPaymentIntentIdAsync(
                paymentIntentId, cancellationToken);

            if (existingOrder is not null)
            {
                _logger.LogInformation(
                    "Order {OrderId} already exists for payment {PaymentIntentId}, skipping duplicate processing",
                    existingOrder.Id, paymentIntentId);
                return existingOrder;
            }

            // Checkout the cart and create the order
            // This will validate stock and recalculate prices one final time
            var order = await _cartService.CheckoutCartAsync(userId, cancellationToken);

            // Update order with payment information
            var updatedOrder = order with
            {
                PaymentIntentId = paymentIntentId,
                Status = OrderStatus.Processing
            };

            await _ordersRepository.UpdateOrderAsync(updatedOrder, cancellationToken);

            _logger.LogInformation(
                "Created order {OrderId} from payment {PaymentIntentId} for user {UserId}",
                updatedOrder.Id, paymentIntentId, userId);

            // Send confirmation email
            await SendOrderConfirmationEmailAsync(
                updatedOrder,
                email,
                userId,
                cancellationToken);

            return updatedOrder;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to process successful payment {PaymentIntentId} for user {UserId}",
                paymentIntentId, userId);
            throw;
        }
    }

    private async Task SendOrderConfirmationEmailAsync(
        Order order,
        string email,
        string userId,
        CancellationToken cancellationToken)
    {
        try
        {
            var user = await _usersRepository.GetUserAsync(userId, cancellationToken);
            var userName = user?.Name ?? "Customer";

            var emailData = new OrderConfirmationEmailData
            {
                RecipientEmail = email,
                RecipientName = userName,
                OrderId = order.Id,
                OrderDate = order.CreatedAt,
                Subtotal = order.Subtotal,
                ShippingCost = order.ShippingCost,
                Total = order.Total,
                Items = order.Items.Select(item => new OrderEmailItem
                {
                    ProductName = item.ProductName,
                    Quantity = item.Quantity,
                    Price = item.UnitPrice,
                    LineTotal = item.LineTotal
                }).ToList()
            };

            await _emailService.SendOrderConfirmationEmailAsync(emailData, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send order confirmation email for order {OrderId}",
                order.Id);
            // Don't throw - email failure shouldn't break the order process
        }
    }
}