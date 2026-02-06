using Application.DTOs;
using Application.Repositories;
using Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class CartService(
    ICartsRepository cartsRepository,
    IProductsRepository productsRepository,
    IOrdersRepository ordersRepository,
    CartValidator cartValidator,
    CartMapper cartMapper,
    ILogger<CartService> logger) : ICartService
{
    private const int CartExpirationDays = 30;
    private const decimal FreeShippingThreshold = 50m;
    private const decimal StandardShippingCost = 5.99m;

    private readonly ICartsRepository _cartsRepository = cartsRepository;
    private readonly IProductsRepository _productsRepository = productsRepository;
    private readonly IOrdersRepository _ordersRepository = ordersRepository;
    private readonly CartValidator _cartValidator = cartValidator;
    private readonly CartMapper _cartMapper = cartMapper;
    private readonly ILogger<CartService> _logger = logger;

    public async Task<CartResponse> GetActiveCartAsync(string userId, CancellationToken cancellationToken = default)
    {
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);

        return _cartMapper.MapToCartResponse(cart);
    }

    public async Task<CartResponse> AddItemToCartAsync(
        string userId,
        AddToCartRequest request,
        CancellationToken cancellationToken = default)
    {
        _cartValidator.ValidateAddToCartRequest(request);

        // Note: sellerId comes from the product request
        var product = await GetValidatedProductAsync(request.ProductId, request.SellerId, cancellationToken);
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);

        var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == request.ProductId);
        _cartValidator.ValidateCartLimits(cart, existingItem, request.ProductId);

        var requestedQuantity = request.Quantity + (existingItem?.Quantity ?? 0);
        _cartValidator.ValidateStock(product, requestedQuantity);

        var items = cart.Items.ToList();

        if (existingItem is not null)
        {
            UpdateExistingCartItem(items, existingItem, product, existingItem.Quantity + request.Quantity);
        }
        else
        {
            items.Add(_cartMapper.CreateCartItemFromProduct(product, request.Quantity));
        }

        var updatedCart = await SaveCartAsync(cart, items, cancellationToken);

        _logger.LogInformation(
            "Added {Quantity} of product {ProductId} to cart {CartId} for user {UserId}",
            request.Quantity, product.Id, updatedCart.Id, userId);

        return _cartMapper.MapToCartResponse(updatedCart);
    }

    public async Task<CartResponse> UpdateCartItemAsync(
        string userId,
        UpdateCartItemRequest request,
        CancellationToken cancellationToken = default)
    {
        _cartValidator.ValidateQuantity(request.Quantity, allowZero: true);

        if (request.Quantity == 0)
        {
            return await RemoveItemFromCartAsync(userId, request.ProductId, cancellationToken);
        }

        var cart = await GetCartOrThrowAsync(userId, cancellationToken);
        var existingItem = GetCartItemOrThrow(cart, request.ProductId);
        var product = await GetValidatedProductAsync(request.ProductId, request.SellerId, cancellationToken);

        _cartValidator.ValidateStock(product, request.Quantity);

        var items = cart.Items.ToList();
        UpdateExistingCartItem(items, existingItem, product, request.Quantity);

        var updatedCart = await SaveCartAsync(cart, items, cancellationToken);

        _logger.LogInformation(
            "Updated product {ProductId} quantity to {Quantity} in cart {CartId} for user {UserId}",
            request.ProductId, request.Quantity, updatedCart.Id, userId);

        return _cartMapper.MapToCartResponse(updatedCart);
    }

    public async Task<CartResponse> RemoveItemFromCartAsync(
        string userId,
        string productId,
        CancellationToken cancellationToken = default)
    {
        var cart = await GetCartOrThrowAsync(userId, cancellationToken);
        GetCartItemOrThrow(cart, productId);

        var items = cart.Items.Where(i => i.ProductId != productId).ToList();

        if (items.Count == 0)
        {
            await _cartsRepository.DeleteCartAsync(userId, cancellationToken);
            _logger.LogInformation("Deleted empty cart {CartId} for user {UserId}", cart.Id, userId);
            return _cartMapper.CreateEmptyCartResponse(userId);
        }

        var updatedCart = await SaveCartAsync(cart, items, cancellationToken);

        _logger.LogInformation(
            "Removed product {ProductId} from cart {CartId} for user {UserId}",
            productId, updatedCart.Id, userId);

        return _cartMapper.MapToCartResponse(updatedCart);
    }

    public async Task<CartResponse> ClearCartAsync(string userId, CancellationToken cancellationToken = default)
    {
        await _cartsRepository.DeleteCartAsync(userId, cancellationToken);
        _logger.LogInformation("Cleared cart for user {UserId}", userId);
        return _cartMapper.CreateEmptyCartResponse(userId);
    }

    public async Task<CartValidationResponse> ValidateCartForCheckoutAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var cart = await GetCartOrThrowAsync(userId, cancellationToken);
        var warnings = new List<string>();

        try
        {
            _cartValidator.ValidateCheckout(cart);
        }
        catch (InvalidOperationException ex)
        {
            return new CartValidationResponse
            {
                IsValid = false,
                CartId = cart.Id,
                Warnings = [ex.Message]
            };
        }

        var validatedItems = await ValidateAndRecalculateCartItemsAsync(cart.Items, cancellationToken);

        if (validatedItems.Count < cart.Items.Count)
        {
            warnings.Add("Some items were removed due to availability issues");
        }

        var subtotal = validatedItems.Sum(i => i.LineTotal);
        var shippingCost = CalculateShippingCost(subtotal);
        var total = subtotal + shippingCost;

        return new CartValidationResponse
        {
            IsValid = true,
            CartId = cart.Id,
            Subtotal = subtotal,
            ShippingCost = shippingCost,
            Total = total,
            Warnings = warnings
        };
    }

    public async Task<Order> CheckoutCartAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var cart = await GetCartOrThrowAsync(userId, cancellationToken);
        _cartValidator.ValidateCheckout(cart);

        var validatedItems = await ValidateAndRecalculateCartItemsAsync(cart.Items, cancellationToken);
        var subtotal = validatedItems.Sum(i => i.LineTotal);
        var shippingCost = CalculateShippingCost(subtotal);

        var completedCart = cart with
        {
            Status = CartStatus.Completed,
            Items = validatedItems,
            Subtotal = subtotal,
            Total = subtotal + shippingCost,
            LastUpdatedAt = DateTime.UtcNow
        };

        await _cartsRepository.UpsertCartAsync(completedCart, cancellationToken);

        var order = _cartMapper.CreateOrderFromCart(cart, validatedItems, subtotal, shippingCost);
        var createdOrder = await _ordersRepository.CreateOrderAsync(order, cancellationToken);

        _logger.LogInformation(
            "Checked out cart {CartId} creating order {OrderId} for user {UserId}",
            cart.Id, createdOrder.Id, userId);

        return createdOrder;
    }

    public async Task MigrateGuestCartAsync(
        string guestId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        var guestCart = await _cartsRepository.GetActiveCartByUserAsync(guestId, cancellationToken);

        if (guestCart is null || guestCart.Items.Count == 0)
        {
            _logger.LogInformation("No guest cart to migrate from {GuestId} to {UserId}", guestId, userId);
            return;
        }

        var userCart = await _cartsRepository.GetActiveCartByUserAsync(userId, cancellationToken);

        if (userCart is null)
        {
            // Simply reassign guest cart to user
            userCart = guestCart with
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                LastUpdatedAt = DateTime.UtcNow
            };
        }
        else
        {
            // Merge carts
            var mergedItems = userCart.Items.ToList();

            foreach (var guestItem in guestCart.Items)
            {
                MergeCartItem(mergedItems, guestItem);
            }

            var subtotal = CartMapper.CalculateSubtotal(mergedItems);

            userCart = userCart with
            {
                Items = mergedItems,
                Subtotal = subtotal,
                Total = subtotal,
                LastUpdatedAt = DateTime.UtcNow
            };
        }

        await _cartsRepository.UpsertCartAsync(userCart, cancellationToken);

        // Delete guest cart
        try
        {
            await _cartsRepository.DeleteCartAsync(guestId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete guest cart {GuestCartId}", guestCart.Id);
        }

        _logger.LogInformation("Migrated cart from guest {GuestId} to user {UserId}", guestId, userId);
    }

    private async Task<Cart> GetOrCreateCartAsync(string userId, CancellationToken cancellationToken)
    {
        var cart = await _cartsRepository.GetActiveCartByUserAsync(userId, cancellationToken);

        if (cart is null)
        {
            return await CreateNewCartAsync(userId, cancellationToken);
        }

        if (IsCartExpired(cart))
        {
            _logger.LogInformation("Cart {CartId} for user {UserId} has expired", cart.Id, userId);
            await _cartsRepository.DeleteCartAsync(userId, cancellationToken);
            return await CreateNewCartAsync(userId, cancellationToken);
        }

        return cart;

    }

    private async Task<Cart> CreateNewCartAsync(string userId, CancellationToken cancellationToken)
    {
        var newCart = new Cart
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Status = CartStatus.Active,
            CreatedAt = DateTime.UtcNow,
            LastUpdatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(CartExpirationDays),
            Items = [],
            Subtotal = 0,
            Total = 0
        };

        await _cartsRepository.UpsertCartAsync(newCart, cancellationToken);
        _logger.LogInformation("Created new cart {CartId} for user {UserId}", newCart.Id, userId);
        return newCart;
    }

    private async Task<Cart> GetCartOrThrowAsync(string userId, CancellationToken cancellationToken)
    {
        var cart = await _cartsRepository.GetActiveCartByUserAsync(userId, cancellationToken);

        if (cart is null)
        {
            throw new InvalidOperationException($"No active cart found for user {userId}");
        }

        return cart;
    }

    private static CartItem GetCartItemOrThrow(Cart cart, string productId)
    {
        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);

        if (item is null)
        {
            throw new InvalidOperationException($"Product {productId} not found in cart");
        }

        return item;
    }

    private static bool IsCartExpired(Cart cart)
    {
        return cart.ExpiresAt.HasValue && cart.ExpiresAt.Value < DateTime.UtcNow;
    }

    private static decimal CalculateShippingCost(decimal subtotal)
    {
        return subtotal > FreeShippingThreshold ? 0 : StandardShippingCost;
    }

    private static void MergeCartItem(List<CartItem> targetItems, CartItem itemToMerge)
    {
        var existingItem = targetItems.FirstOrDefault(i => i.ProductId == itemToMerge.ProductId);

        if (existingItem is not null)
        {
            var index = targetItems.IndexOf(existingItem);
            var newQuantity = Math.Min(
                existingItem.Quantity + itemToMerge.Quantity,
                CartValidator.MAX_QUANTITY_PER_ITEM);

            targetItems[index] = existingItem with
            {
                Quantity = newQuantity,
                LineTotal = existingItem.UnitPrice * newQuantity
            };
        }
        else if (targetItems.Count < CartValidator.MAX_CART_ITEMS)
        {
            targetItems.Add(itemToMerge);
        }
    }

    private async Task<Cart> SaveCartAsync(Cart cart, List<CartItem> items, CancellationToken cancellationToken)
    {
        var updatedCart = _cartMapper.RecalculateCartTotals(cart, items);
        await _cartsRepository.UpsertCartAsync(updatedCart, cancellationToken);
        return updatedCart;
    }

    private void UpdateExistingCartItem(List<CartItem> items, CartItem existingItem, Product product, int newQuantity)
    {
        var index = items.IndexOf(existingItem);
        items[index] = _cartMapper.UpdateCartItemFromProduct(
            product,
            newQuantity,
            existingItem.AddedDate,
            existingItem.SellerId,
            existingItem.SellerName);
    }

    private async Task<Product> GetValidatedProductAsync(
        string productId,
        string sellerId,
        CancellationToken cancellationToken)
    {
        var product = await _productsRepository.GetProductAsync(productId, sellerId, cancellationToken);

        if (product == null)
        {
            throw new InvalidOperationException($"Product {productId} not found");
        }

        return product;
    }

    private async Task<List<CartItem>> ValidateAndRecalculateCartItemsAsync(
        IReadOnlyList<CartItem> items,
        CancellationToken cancellationToken)
    {
        var validatedItems = new List<CartItem>();

        foreach (var item in items)
        {
            var product = await GetValidatedProductAsync(item.ProductId, item.SellerId, cancellationToken);

            var updatedItem = _cartMapper.UpdateCartItemFromProduct(
                product,
                item.Quantity,
                item.AddedDate,
                item.SellerId,
                item.SellerName);
            validatedItems.Add(updatedItem);
        }

        return validatedItems;
    }
}