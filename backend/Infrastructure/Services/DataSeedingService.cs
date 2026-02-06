using Application.Repositories;
using Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public sealed class DataSeedingService(
    ICategoriesRepository categoriesRepository,
    IUsersRepository usersRepository,
    IProductsRepository productsRepository,
    ILogger<DataSeedingService> logger)
{
    private readonly ICategoriesRepository _categoriesRepository = categoriesRepository ?? throw new ArgumentNullException(nameof(categoriesRepository));
    private readonly IUsersRepository _usersRepository = usersRepository ?? throw new ArgumentNullException(nameof(usersRepository));
    private readonly IProductsRepository _productsRepository = productsRepository ?? throw new ArgumentNullException(nameof(productsRepository));
    private readonly ILogger<DataSeedingService> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task SeedDataAsync(CancellationToken cancellationToken = default)
    {
        // Toggle manually when seeding is needed during development
        var enableSeeding = false;
        if (!enableSeeding)
        {
            return;
        }
        _logger.LogInformation("Starting data seeding...");

        _logger.LogInformation("Clearing existing data...");
        await ClearExistingDataAsync(cancellationToken);
        _logger.LogInformation("Existing data cleared");

        var categories = await SeedCategoriesAsync(cancellationToken);
        _logger.LogInformation("Seeded {Count} categories", categories.Count);

        var sellers = await SeedUsersAsync(cancellationToken);
        _logger.LogInformation("Seeded {Count} sellers", sellers.Count);

        var productsCount = await SeedProductsAsync(categories, sellers, cancellationToken);
        _logger.LogInformation("Seeded {Count} products", productsCount);

        _logger.LogInformation("Data seeding completed successfully");
    }

    private async Task ClearExistingDataAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting existing products...");
        var existingProducts = await _productsRepository.GetAllProductsAsync(cancellationToken);
        foreach (var product in existingProducts)
        {
            await _productsRepository.DeleteProductAsync(product.Id, product.SellerId, cancellationToken);
        }
        _logger.LogInformation("Deleted {Count} products", existingProducts.Count);

        _logger.LogInformation("Deleting existing categories...");
        var existingCategories = await _categoriesRepository.GetCategoriesAsync(cancellationToken);
        foreach (var category in existingCategories)
        {
            await _categoriesRepository.DeleteCategoryAsync(category.Id, cancellationToken);
        }
        _logger.LogInformation("Deleted {Count} categories", existingCategories.Count);

        _logger.LogWarning("Users are not deleted. Please manually delete from Azure Cosmos DB if needed.");
    }

    private async Task<List<Category>> SeedCategoriesAsync(CancellationToken cancellationToken)
    {
        var categories = new List<Category>
        {
            new()
            {
                Id = "cat-electronics",
                Name = "Electronics",
                Slug = "electronics",
                Description = "Electronic devices and accessories",
                Image = "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
                Featured = true
            },
            new()
            {
                Id = "cat-laptops",
                Name = "Laptops",
                Slug = "laptops",
                Description = "Portable computers and notebooks",
                ParentCategoryId = "cat-electronics",
                Image = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
                Featured = true
            },
            new()
            {
                Id = "cat-smartphones",
                Name = "Smartphones",
                Slug = "smartphones",
                Description = "Mobile phones and accessories",
                ParentCategoryId = "cat-electronics",
                Image = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"
            },
            new()
            {
                Id = "cat-clothing",
                Name = "Clothing",
                Slug = "clothing",
                Description = "Fashion and apparel",
                Image = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400",
                Featured = true
            },
            new()
            {
                Id = "cat-mens-clothing",
                Name = "Men's Clothing",
                Slug = "mens-clothing",
                Description = "Clothing for men",
                ParentCategoryId = "cat-clothing",
                Image = "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400"
            },
            new()
            {
                Id = "cat-womens-clothing",
                Name = "Women's Clothing",
                Slug = "womens-clothing",
                Description = "Clothing for women",
                ParentCategoryId = "cat-clothing",
                Image = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400"
            },
            new()
            {
                Id = "cat-home-garden",
                Name = "Home & Garden",
                Slug = "home-garden",
                Description = "Home improvement and garden supplies",
                Image = "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400"
            },
            new()
            {
                Id = "cat-books",
                Name = "Books",
                Slug = "books",
                Description = "Physical and digital books",
                Image = "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400"
            },
            new()
            {
                Id = "cat-sports",
                Name = "Sports & Outdoors",
                Slug = "sports-outdoors",
                Description = "Sports equipment and outdoor gear",
                Image = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400",
                Featured = true
            },
            // Beauty & Personal Care
            new()
            {
                Id = "cat-beauty",
                Name = "Beauty & Personal Care",
                Slug = "beauty-personal-care",
                Description = "Skincare, makeup, and personal care products",
                Image = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400",
                Featured = true
            },
            new()
            {
                Id = "cat-skincare",
                Name = "Skincare",
                Slug = "skincare",
                Description = "Face and body skincare products",
                ParentCategoryId = "cat-beauty",
                Image = "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400"
            },
            new()
            {
                Id = "cat-makeup",
                Name = "Makeup",
                Slug = "makeup",
                Description = "Cosmetics and makeup products",
                ParentCategoryId = "cat-beauty",
                Image = "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400"
            },
            // Toys & Games
            new()
            {
                Id = "cat-toys",
                Name = "Toys & Games",
                Slug = "toys-games",
                Description = "Toys, games, and entertainment for all ages",
                Image = "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400",
                Featured = true
            },
            new()
            {
                Id = "cat-action-figures",
                Name = "Action Figures",
                Slug = "action-figures",
                Description = "Collectible action figures and toys",
                ParentCategoryId = "cat-toys",
                Image = "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=400"
            },
            new()
            {
                Id = "cat-board-games",
                Name = "Board Games",
                Slug = "board-games",
                Description = "Family and strategy board games",
                ParentCategoryId = "cat-toys",
                Image = "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400"
            },
            // Automotive
            new()
            {
                Id = "cat-automotive",
                Name = "Automotive",
                Slug = "automotive",
                Description = "Car parts, accessories, and tools",
                Image = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400"
            },
            new()
            {
                Id = "cat-car-accessories",
                Name = "Car Accessories",
                Slug = "car-accessories",
                Description = "Interior and exterior car accessories",
                ParentCategoryId = "cat-automotive",
                Image = "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400"
            },
            // Office Supplies
            new()
            {
                Id = "cat-office",
                Name = "Office Supplies",
                Slug = "office-supplies",
                Description = "Office essentials and stationery",
                Image = "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400"
            },
            new()
            {
                Id = "cat-stationery",
                Name = "Stationery",
                Slug = "stationery",
                Description = "Notebooks, pens, and writing supplies",
                ParentCategoryId = "cat-office",
                Image = "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400"
            },
            // Pets
            new()
            {
                Id = "cat-pets",
                Name = "Pet Supplies",
                Slug = "pet-supplies",
                Description = "Food, toys, and accessories for pets",
                Image = "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400"
            },
            new()
            {
                Id = "cat-pet-toys",
                Name = "Pet Toys",
                Slug = "pet-toys",
                Description = "Toys and entertainment for pets",
                ParentCategoryId = "cat-pets",
                Image = "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=400"
            },
            // Food & Beverages
            new()
            {
                Id = "cat-food",
                Name = "Food & Beverages",
                Slug = "food",
                Description = "Groceries and beverages",
                Image = "https://images.unsplash.com/photo-1498579809087-ef1e558fd1da?w=400"
            }
        };

        var created = new List<Category>();
        foreach (var category in categories)
        {
            var createdCategory = await _categoriesRepository.CreateCategoryAsync(category, cancellationToken);
            created.Add(createdCategory);
        }

        return created;
    }

    private async Task<List<User>> SeedUsersAsync(CancellationToken cancellationToken)
    {
        var users = new List<User>
        {
            new()
            {
                Id = "user-1",
                Name = "John Doe",
                Email = "john.doe@example.com",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "John's Electronics",
                    StoreDescription = "Quality electronics at great prices",
                    IsVerified = true,
                    AverageRating = 4.5m
                }
            },
            new()
            {
                Id = "user-2",
                Name = "Jane Smith",
                Email = "jane.smith@example.com",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Fashion Boutique",
                    StoreDescription = "Trendy fashion for everyone",
                    IsVerified = true,
                    AverageRating = 4.8m
                }
            }
        };

        var created = new List<User>();
        foreach (var user in users)
        {
            var createdUser = await _usersRepository.CreateUserAsync(user, cancellationToken);
            created.Add(createdUser);
        }

        return created;
    }

    private async Task<int> SeedProductsAsync(
        List<Category> categories,
        List<User> sellers,
        CancellationToken cancellationToken)
    {
        var products = new List<Product>
        {
            new()
            {
                Id = "prod-1",
                Name = "Laptop Pro 15",
                Slug = "laptop-pro-15",
                Description = "High-performance laptop with 16GB RAM",
                Price = 1299.99m,
                Stock = 10,
                SellerId = sellers[0].Id,
                Seller = new Seller { Id = sellers[0].Id, DisplayName = sellers[0].Name },
                CategoryIds = ["cat-laptops"],
                ImageUrls = ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"],
                Featured = true
            }
        };

        var createdCount = 0;
        foreach (var product in products)
        {
            await _productsRepository.CreateProductAsync(product, cancellationToken);
            createdCount++;
        }

        return createdCount;
    }
}