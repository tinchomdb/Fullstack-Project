using Application.DTOs;
using Application.Services;
using Domain.Entities;
using Api.Tests.Helpers;

namespace Api.Tests.Unit.Services;

public class CartValidatorTests
{
    private readonly CartValidator _validator = new();

    // --- ValidateAddToCartRequest ---

    [Fact]
    public void ValidateAddToCartRequest_WithValidRequest_DoesNotThrow()
    {
        // Arrange
        var request = new AddToCartRequest { ProductId = "product-1", SellerId = "seller-1", Quantity = 2 };

        // Act & Assert (no exception)
        _validator.ValidateAddToCartRequest(request);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ValidateAddToCartRequest_WithInvalidProductId_ThrowsArgumentException(string? productId)
    {
        // Arrange
        var request = new AddToCartRequest { ProductId = productId!, Quantity = 1 };

        // Act & Assert
        Assert.Throws<ArgumentException>(() => _validator.ValidateAddToCartRequest(request));
    }

    [Fact]
    public void ValidateAddToCartRequest_WithZeroQuantity_ThrowsArgumentException()
    {
        // Arrange
        var request = new AddToCartRequest { ProductId = "product-1", Quantity = 0 };

        // Act & Assert
        Assert.Throws<ArgumentException>(() => _validator.ValidateAddToCartRequest(request));
    }

    [Fact]
    public void ValidateAddToCartRequest_WithNegativeQuantity_ThrowsArgumentException()
    {
        // Arrange
        var request = new AddToCartRequest { ProductId = "product-1", Quantity = -1 };

        // Act & Assert
        Assert.Throws<ArgumentException>(() => _validator.ValidateAddToCartRequest(request));
    }

    [Fact]
    public void ValidateAddToCartRequest_WithExcessiveQuantity_ThrowsArgumentException()
    {
        // Arrange
        var request = new AddToCartRequest
        {
            ProductId = "product-1",
            Quantity = CartValidator.MAX_QUANTITY_PER_ITEM + 1
        };

        // Act & Assert
        Assert.Throws<ArgumentException>(() => _validator.ValidateAddToCartRequest(request));
    }

    // --- ValidateQuantity ---

    [Fact]
    public void ValidateQuantity_WithValidQuantity_DoesNotThrow()
    {
        _validator.ValidateQuantity(5, allowZero: false);
    }

    [Fact]
    public void ValidateQuantity_WithZeroWhenAllowed_DoesNotThrow()
    {
        _validator.ValidateQuantity(0, allowZero: true);
    }

    [Fact]
    public void ValidateQuantity_WithZeroWhenNotAllowed_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => _validator.ValidateQuantity(0, allowZero: false));
    }

    [Fact]
    public void ValidateQuantity_WithNegativeWhenZeroAllowed_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => _validator.ValidateQuantity(-1, allowZero: true));
    }

    [Fact]
    public void ValidateQuantity_WithNegativeWhenZeroNotAllowed_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(() => _validator.ValidateQuantity(-5, allowZero: false));
    }

    [Fact]
    public void ValidateQuantity_AtMaxLimit_DoesNotThrow()
    {
        _validator.ValidateQuantity(CartValidator.MAX_QUANTITY_PER_ITEM, allowZero: false);
    }

    [Fact]
    public void ValidateQuantity_ExceedsMaxLimit_ThrowsArgumentException()
    {
        Assert.Throws<ArgumentException>(
            () => _validator.ValidateQuantity(CartValidator.MAX_QUANTITY_PER_ITEM + 1, allowZero: false));
    }

    // --- ValidateCartLimits ---

    [Fact]
    public void ValidateCartLimits_WithExistingItem_DoesNotThrow()
    {
        // Arrange — cart at max items, but item already exists
        var items = Enumerable.Range(0, CartValidator.MAX_CART_ITEMS)
            .Select(i => TestDataBuilder.CreateCartItem(productId: $"product-{i}"))
            .ToList();
        var cart = TestDataBuilder.CreateCart(items: items);
        var existingItem = items[0];

        // Act & Assert (no exception — updating existing item is allowed)
        _validator.ValidateCartLimits(cart, existingItem, existingItem.ProductId);
    }

    [Fact]
    public void ValidateCartLimits_NewItemUnderLimit_DoesNotThrow()
    {
        // Arrange
        var cart = TestDataBuilder.CreateCart(items: [TestDataBuilder.CreateCartItem()]);

        // Act & Assert
        _validator.ValidateCartLimits(cart, null, "new-product");
    }

    [Fact]
    public void ValidateCartLimits_NewItemAtMaxLimit_ThrowsInvalidOperationException()
    {
        // Arrange — cart already at max
        var items = Enumerable.Range(0, CartValidator.MAX_CART_ITEMS)
            .Select(i => TestDataBuilder.CreateCartItem(productId: $"product-{i}"))
            .ToList();
        var cart = TestDataBuilder.CreateCart(items: items);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(
            () => _validator.ValidateCartLimits(cart, null, "new-product"));
    }

    // --- ValidateStock ---

    [Fact]
    public void ValidateStock_WithSufficientStock_DoesNotThrow()
    {
        var product = TestDataBuilder.CreateProduct(stock: 10);
        _validator.ValidateStock(product, 5);
    }

    [Fact]
    public void ValidateStock_AtExactStock_DoesNotThrow()
    {
        var product = TestDataBuilder.CreateProduct(stock: 10);
        _validator.ValidateStock(product, 10);
    }

    [Fact]
    public void ValidateStock_ExceedsStock_ThrowsInvalidOperationException()
    {
        var product = TestDataBuilder.CreateProduct(stock: 5);
        Assert.Throws<InvalidOperationException>(() => _validator.ValidateStock(product, 6));
    }

    // --- ValidateCheckout ---

    [Fact]
    public void ValidateCheckout_WithActiveCartAndItems_DoesNotThrow()
    {
        var cart = TestDataBuilder.CreateCart(
            status: CartStatus.Active,
            items: [TestDataBuilder.CreateCartItem()]);
        _validator.ValidateCheckout(cart);
    }

    [Fact]
    public void ValidateCheckout_WithInactiveCart_ThrowsInvalidOperationException()
    {
        var cart = TestDataBuilder.CreateCart(
            status: CartStatus.Completed,
            items: [TestDataBuilder.CreateCartItem()]);

        Assert.Throws<InvalidOperationException>(() => _validator.ValidateCheckout(cart));
    }

    [Fact]
    public void ValidateCheckout_WithEmptyCart_ThrowsInvalidOperationException()
    {
        var cart = TestDataBuilder.CreateCart(status: CartStatus.Active, items: []);

        Assert.Throws<InvalidOperationException>(() => _validator.ValidateCheckout(cart));
    }
}
