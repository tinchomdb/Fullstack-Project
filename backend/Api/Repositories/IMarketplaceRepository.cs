using Api.Models;

namespace Api.Repositories;

public interface IMarketplaceRepository
{
    IReadOnlyList<Product> GetProducts();

    Product? GetProduct(Guid productId);

    IReadOnlyList<Category> GetCategories();

    Category? GetCategory(Guid categoryId);

    IReadOnlyList<Cart> GetCarts();

    Cart? GetCart(Guid cartId);

    Cart? GetCartByUser(Guid userId);

    IReadOnlyList<Order> GetOrders();

    IReadOnlyList<Order> GetOrdersByUser(Guid userId);

    Order? GetOrder(Guid orderId);
}
