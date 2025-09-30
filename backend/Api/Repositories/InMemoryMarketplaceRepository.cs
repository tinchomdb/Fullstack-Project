using System.Linq;
using Api.Models;

namespace Api.Repositories;

public sealed class InMemoryMarketplaceRepository : IMarketplaceRepository
{
    private readonly IReadOnlyList<Category> categories;
    private readonly IReadOnlyList<Seller> sellers;
    private readonly IReadOnlyList<Product> products;
    private readonly IReadOnlyList<Cart> carts;
    private readonly IReadOnlyList<Order> orders;

    public InMemoryMarketplaceRepository()
    {
        var now = DateTime.UtcNow;

        var electronicsCategoryId = Guid.Parse("5ef4f560-8dbc-4f1b-b112-c9fc97815137");
        var apparelCategoryId = Guid.Parse("2e9dcd67-c087-40a0-9cdf-79e324f902c6");
        var homeCategoryId = Guid.Parse("a4994fbd-8d4e-4a46-9a17-9fcbcb6d1f2c");

        categories =
        [
            new()
            {
                Id = electronicsCategoryId,
                Name = "Electronics",
                Slug = "electronics",
                Description = "Devices, accessories, and smart gadgets."
            },
            new()
            {
                Id = apparelCategoryId,
                Name = "Apparel",
                Slug = "apparel",
                Description = "Clothing and wearable accessories."
            },
            new()
            {
                Id = homeCategoryId,
                Name = "Home & Kitchen",
                Slug = "home-kitchen",
                Description = "Furniture, decor, and kitchen essentials."
            }
        ];

        var sellerTechWarehouseId = Guid.Parse("8a2c0273-7bb2-4c5e-9e3b-308e9f97c4cd");
        var sellerUrbanThreadsId = Guid.Parse("dc7577a0-dfd3-4b32-a10c-654d69344032");

        sellers =
        [
            new()
            {
                Id = sellerTechWarehouseId,
                DisplayName = "Tech Warehouse",
                CompanyName = "Tech Warehouse LLC",
                Email = "sales@techwarehouse.example"
            },
            new()
            {
                Id = sellerUrbanThreadsId,
                DisplayName = "Urban Threads",
                CompanyName = "Urban Threads Co.",
                Email = "hello@urbanthreads.example"
            }
        ];

        products =
        [
            new()
            {
                Id = Guid.Parse("65dbb5eb-ef1a-4927-9a83-91ab110f3efb"),
                Name = "Noise-Cancelling Headphones",
                Description = "Wireless over-ear headphones with active noise cancellation and 30-hour battery life.",
                Price = 249.99m,
                Currency = "USD",
                CategoryId = electronicsCategoryId,
                Seller = sellers[0],
                ImageUrls =
                [
                    "https://cdn.example.com/products/headphones-front.jpg",
                    "https://cdn.example.com/products/headphones-side.jpg"
                ],
                CreatedAt = now.AddDays(-30),
                UpdatedAt = now.AddDays(-7)
            },
            new()
            {
                Id = Guid.Parse("b6f1ff2a-2911-4aeb-b33f-6ed3d30d5bb4"),
                Name = "Smart Home Speaker",
                Description = "Voice-controlled smart speaker with multi-room audio support.",
                Price = 129.00m,
                Currency = "USD",
                CategoryId = electronicsCategoryId,
                Seller = sellers[0],
                ImageUrls =
                [
                    "https://cdn.example.com/products/smart-speaker-front.jpg"
                ],
                CreatedAt = now.AddDays(-45),
                UpdatedAt = now.AddDays(-3)
            },
            new()
            {
                Id = Guid.Parse("35fd7b15-68cf-4d2f-8d71-ec0a1f6d3d58"),
                Name = "Organic Cotton Hoodie",
                Description = "Unisex hoodie made with 100% organic cotton and recycled materials.",
                Price = 89.50m,
                Currency = "USD",
                CategoryId = apparelCategoryId,
                Seller = sellers[1],
                ImageUrls =
                [
                    "https://cdn.example.com/products/hoodie-front.jpg",
                    "https://cdn.example.com/products/hoodie-back.jpg"
                ],
                CreatedAt = now.AddDays(-20),
                UpdatedAt = now.AddDays(-1)
            },
            new()
            {
                Id = Guid.Parse("5bf6c3bb-1e13-41d9-b2fa-68865a2ef6a6"),
                Name = "Cast Iron Skillet Set",
                Description = "Pre-seasoned skillet set with ergonomic handles and heat-resistant grips.",
                Price = 139.95m,
                Currency = "USD",
                CategoryId = homeCategoryId,
                Seller = sellers[0],
                ImageUrls =
                [
                    "https://cdn.example.com/products/skillet-main.jpg"
                ],
                CreatedAt = now.AddDays(-12),
                UpdatedAt = now.AddDays(-2)
            }
        ];

        var cart1Id = Guid.Parse("4c63a3a0-3107-4b30-9d13-6002fa0ba8ad");
        var userAliceId = Guid.Parse("f6b4d0a0-7b9b-42ce-a4ce-f201b80c7a6c");
        var userBobId = Guid.Parse("3a44e4d4-98c2-4a8e-8108-76c5863cddd8");

        carts =
        [
            new()
            {
                Id = cart1Id,
                UserId = userAliceId,
                LastUpdatedAt = now.AddHours(-5),
                Currency = "USD",
                Subtotal = 339.49m,
                Total = 339.49m,
                Items =
                [
                    new()
                    {
                        ProductId = products[0].Id,
                        ProductName = products[0].Name,
                        ImageUrl = products[0].ImageUrls.FirstOrDefault() ?? string.Empty,
                        Quantity = 1,
                        UnitPrice = products[0].Price,
                        LineTotal = products[0].Price
                    },
                    new()
                    {
                        ProductId = products[2].Id,
                        ProductName = products[2].Name,
                        ImageUrl = products[2].ImageUrls.FirstOrDefault() ?? string.Empty,
                        Quantity = 1,
                        UnitPrice = products[2].Price,
                        LineTotal = products[2].Price
                    }
                ]
            },
            new()
            {
                Id = Guid.Parse("b6c5e36b-ad4f-4780-a741-7cda5c99f3c5"),
                UserId = userBobId,
                LastUpdatedAt = now.AddHours(-2),
                Currency = "USD",
                Subtotal = 129.00m,
                Total = 129.00m,
                Items =
                [
                    new()
                    {
                        ProductId = products[1].Id,
                        ProductName = products[1].Name,
                        ImageUrl = products[1].ImageUrls.FirstOrDefault() ?? string.Empty,
                        Quantity = 1,
                        UnitPrice = products[1].Price,
                        LineTotal = products[1].Price
                    }
                ]
            }
        ];

        orders =
        [
            new()
            {
                Id = Guid.Parse("983a04ad-1289-4f5d-9769-965eecb11931"),
                UserId = userAliceId,
                OrderDate = now.AddDays(-2),
                Status = OrderStatus.Processing,
                Currency = "USD",
                Subtotal = 389.49m,
                ShippingCost = 15.00m,
                Total = 404.49m,
                Items =
                [
                    new()
                    {
                        ProductId = products[0].Id,
                        ProductName = products[0].Name,
                        ImageUrl = products[0].ImageUrls.FirstOrDefault() ?? string.Empty,
                        Quantity = 1,
                        UnitPrice = products[0].Price,
                        LineTotal = products[0].Price
                    },
                    new()
                    {
                        ProductId = products[3].Id,
                        ProductName = products[3].Name,
                        ImageUrl = products[3].ImageUrls.FirstOrDefault() ?? string.Empty,
                        Quantity = 1,
                        UnitPrice = products[3].Price,
                        LineTotal = products[3].Price
                    }
                ]
            },
            new()
            {
                Id = Guid.Parse("13017864-c510-4a06-a3f7-4fe046ca727c"),
                UserId = userBobId,
                OrderDate = now.AddDays(-10),
                Status = OrderStatus.Delivered,
                Currency = "USD",
                Subtotal = 89.50m,
                ShippingCost = 9.99m,
                Total = 99.49m,
                Items =
                [
                    new()
                    {
                        ProductId = products[2].Id,
                        ProductName = products[2].Name,
                        ImageUrl = products[2].ImageUrls.FirstOrDefault() ?? string.Empty,
                        Quantity = 1,
                        UnitPrice = products[2].Price,
                        LineTotal = products[2].Price
                    }
                ]
            }
        ];
    }

    public IReadOnlyList<Product> GetProducts()
    {
        return products;
    }

    public Product? GetProduct(Guid productId)
    {
        return products.FirstOrDefault(p => p.Id == productId);
    }

    public IReadOnlyList<Category> GetCategories()
    {
        return categories;
    }

    public Category? GetCategory(Guid categoryId)
    {
        return categories.FirstOrDefault(c => c.Id == categoryId);
    }

    public IReadOnlyList<Cart> GetCarts()
    {
        return carts;
    }

    public Cart? GetCart(Guid cartId)
    {
        return carts.FirstOrDefault(c => c.Id == cartId);
    }

    public Cart? GetCartByUser(Guid userId)
    {
        return carts.FirstOrDefault(c => c.UserId == userId);
    }

    public IReadOnlyList<Order> GetOrders()
    {
        return orders;
    }

    public IReadOnlyList<Order> GetOrdersByUser(Guid userId)
    {
        return orders.Where(o => o.UserId == userId).ToList();
    }

    public Order? GetOrder(Guid orderId)
    {
        return orders.FirstOrDefault(o => o.Id == orderId);
    }
}
