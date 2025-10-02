using Api.Models;
using Api.Repositories;

namespace Api.Services;

public class DataSeedingService(
    ICategoriesRepository categoriesRepository,
    IUsersRepository usersRepository,
    IProductsRepository productsRepository)
{
    private readonly ICategoriesRepository _categoriesRepository = categoriesRepository;
    private readonly IUsersRepository _usersRepository = usersRepository;
    private readonly IProductsRepository _productsRepository = productsRepository;

    public async Task SeedDataAsync(CancellationToken cancellationToken = default)
    {
        Console.WriteLine("Starting data seeding...");

        // Check if data already exists
        var existingCategories = await _categoriesRepository.GetCategoriesAsync(cancellationToken);
        if (existingCategories.Count > 0)
        {
            Console.WriteLine("Data already seeded. Skipping...");
            return;
        }

        // Seed Categories
        var categories = await SeedCategoriesAsync(cancellationToken);
        Console.WriteLine($"✓ Seeded {categories.Count} categories");

        // Seed Users (with some sellers)
        var sellers = await SeedUsersAsync(cancellationToken);
        Console.WriteLine($"✓ Seeded {sellers.Count} sellers");

        // Seed Products
        var productsCount = await SeedProductsAsync(categories, sellers, cancellationToken);
        Console.WriteLine($"✓ Seeded {productsCount} products");

        Console.WriteLine("Data seeding completed successfully!");
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
                Description = "Electronic devices and accessories"
            },
            new()
            {
                Id = "cat-laptops",
                Name = "Laptops",
                Slug = "laptops",
                Description = "Portable computers and notebooks",
                ParentCategoryId = "cat-electronics"
            },
            new()
            {
                Id = "cat-smartphones",
                Name = "Smartphones",
                Slug = "smartphones",
                Description = "Mobile phones and accessories",
                ParentCategoryId = "cat-electronics"
            },
            new()
            {
                Id = "cat-clothing",
                Name = "Clothing",
                Slug = "clothing",
                Description = "Fashion and apparel"
            },
            new()
            {
                Id = "cat-mens-clothing",
                Name = "Men's Clothing",
                Slug = "mens-clothing",
                Description = "Clothing for men",
                ParentCategoryId = "cat-clothing"
            },
            new()
            {
                Id = "cat-womens-clothing",
                Name = "Women's Clothing",
                Slug = "womens-clothing",
                Description = "Clothing for women",
                ParentCategoryId = "cat-clothing"
            },
            new()
            {
                Id = "cat-home-garden",
                Name = "Home & Garden",
                Slug = "home-garden",
                Description = "Home improvement and garden supplies"
            },
            new()
            {
                Id = "cat-books",
                Name = "Books",
                Slug = "books",
                Description = "Physical and digital books"
            },
            new()
            {
                Id = "cat-sports",
                Name = "Sports & Outdoors",
                Slug = "sports-outdoors",
                Description = "Sports equipment and outdoor gear"
            }
        };

        foreach (var category in categories)
        {
            await _categoriesRepository.CreateCategoryAsync(category, cancellationToken);
        }

        return categories;
    }

    private async Task<List<User>> SeedUsersAsync(CancellationToken cancellationToken)
    {
        var sellers = new List<User>
        {
            new()
            {
                Id = "seller-techpro",
                Email = "contact@techpro.com",
                Name = "TechPro Store",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "TechPro Electronics",
                    StoreDescription = "Your trusted source for quality electronics",
                    AverageRating = 4.7m,
                    TotalProducts = 0,
                    TotalOrders = 152,
                    TotalReviews = 127
                }
            },
            new()
            {
                Id = "seller-fashion",
                Email = "info@fashionhub.com",
                Name = "Fashion Hub",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Fashion Hub",
                    StoreDescription = "Latest trends in fashion and apparel",
                    AverageRating = 4.5m,
                    TotalProducts = 0,
                    TotalOrders = 89,
                    TotalReviews = 73
                }
            },
            new()
            {
                Id = "seller-bookworm",
                Email = "hello@bookworm.com",
                Name = "Bookworm Paradise",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Bookworm Paradise",
                    StoreDescription = "Curated collection of books for every reader",
                    AverageRating = 4.9m,
                    TotalProducts = 0,
                    TotalOrders = 234,
                    TotalReviews = 198
                }
            },
            new()
            {
                Id = "seller-outdoor",
                Email = "support@outdoorgear.com",
                Name = "Outdoor Gear Co",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Outdoor Gear Co",
                    StoreDescription = "Equipment for your next adventure",
                    AverageRating = 4.6m,
                    TotalProducts = 0,
                    TotalOrders = 112,
                    TotalReviews = 95
                }
            }
        };

        foreach (var seller in sellers)
        {
            await _usersRepository.CreateUserAsync(seller, cancellationToken);
        }

        return sellers;
    }

    private async Task<int> SeedProductsAsync(
        List<Category> categories,
        List<User> sellers,
        CancellationToken cancellationToken)
    {
        var techProSeller = sellers.First(s => s.Id == "seller-techpro");
        var fashionSeller = sellers.First(s => s.Id == "seller-fashion");
        var bookwormSeller = sellers.First(s => s.Id == "seller-bookworm");
        var outdoorSeller = sellers.First(s => s.Id == "seller-outdoor");

        var products = new List<Product>
        {
            // Electronics - TechPro
            new()
            {
                Name = "MacBook Pro 16\" M3",
                Description = "Apple MacBook Pro 16-inch with M3 chip, 16GB RAM, 512GB SSD. Perfect for developers and creative professionals.",
                Price = 2499.99m,
                Stock = 15,
                SellerId = techProSeller.Id,
                CategoryIds = ["cat-electronics", "cat-laptops"],
                Seller = new Seller
                {
                    Id = techProSeller.Id,
                    DisplayName = techProSeller.SellerProfile!.StoreName,
                    Email = techProSeller.Email,
                    AverageRating = techProSeller.SellerProfile.AverageRating,
                    TotalProducts = 8
                },
                ImageUrls = ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"]
            },
            new()
            {
                Name = "Dell XPS 15",
                Description = "Dell XPS 15 with Intel Core i7, 32GB RAM, 1TB SSD, NVIDIA RTX 4050. Premium build quality.",
                Price = 2199.99m,
                Stock = 8,
                SellerId = techProSeller.Id,
                CategoryIds = ["cat-electronics", "cat-laptops"],
                Seller = new Seller
                {
                    Id = techProSeller.Id,
                    DisplayName = techProSeller.SellerProfile!.StoreName,
                    Email = techProSeller.Email,
                    AverageRating = techProSeller.SellerProfile.AverageRating,
                    TotalProducts = 8
                },
                ImageUrls = ["https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800"]
            },
            new()
            {
                Name = "iPhone 15 Pro",
                Description = "Apple iPhone 15 Pro with A17 Pro chip, 256GB storage, Titanium finish. Advanced camera system.",
                Price = 1199.99m,
                Stock = 25,
                SellerId = techProSeller.Id,
                CategoryIds = ["cat-electronics", "cat-smartphones"],
                Seller = new Seller
                {
                    Id = techProSeller.Id,
                    DisplayName = techProSeller.SellerProfile!.StoreName,
                    Email = techProSeller.Email,
                    AverageRating = techProSeller.SellerProfile.AverageRating,
                    TotalProducts = 8
                },
                ImageUrls = ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800"]
            },
            new()
            {
                Name = "Samsung Galaxy S24 Ultra",
                Description = "Samsung Galaxy S24 Ultra with 512GB storage, S Pen included. Best Android flagship.",
                Price = 1299.99m,
                Stock = 18,
                SellerId = techProSeller.Id,
                CategoryIds = ["cat-electronics", "cat-smartphones"],
                Seller = new Seller
                {
                    Id = techProSeller.Id,
                    DisplayName = techProSeller.SellerProfile!.StoreName,
                    Email = techProSeller.Email,
                    AverageRating = techProSeller.SellerProfile.AverageRating,
                    TotalProducts = 8
                },
                ImageUrls = ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800"]
            },

            // Fashion - Fashion Hub
            new()
            {
                Name = "Men's Classic Denim Jacket",
                Description = "Premium denim jacket with vintage wash. 100% cotton, comfortable fit.",
                Price = 79.99m,
                Stock = 45,
                SellerId = fashionSeller.Id,
                CategoryIds = ["cat-clothing", "cat-mens-clothing"],
                Seller = new Seller
                {
                    Id = fashionSeller.Id,
                    DisplayName = fashionSeller.SellerProfile!.StoreName,
                    Email = fashionSeller.Email,
                    AverageRating = fashionSeller.SellerProfile.AverageRating,
                    TotalProducts = 6
                },
                ImageUrls = ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"]
            },
            new()
            {
                Name = "Women's Summer Dress",
                Description = "Floral print summer dress, lightweight and breathable. Perfect for warm weather.",
                Price = 59.99m,
                Stock = 60,
                SellerId = fashionSeller.Id,
                CategoryIds = ["cat-clothing", "cat-womens-clothing"],
                Seller = new Seller
                {
                    Id = fashionSeller.Id,
                    DisplayName = fashionSeller.SellerProfile!.StoreName,
                    Email = fashionSeller.Email,
                    AverageRating = fashionSeller.SellerProfile.AverageRating,
                    TotalProducts = 6
                },
                ImageUrls = ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800"]
            },
            new()
            {
                Name = "Men's Athletic Sneakers",
                Description = "Comfortable running shoes with excellent cushioning and support.",
                Price = 89.99m,
                Stock = 35,
                SellerId = fashionSeller.Id,
                CategoryIds = ["cat-clothing", "cat-mens-clothing"],
                Seller = new Seller
                {
                    Id = fashionSeller.Id,
                    DisplayName = fashionSeller.SellerProfile!.StoreName,
                    Email = fashionSeller.Email,
                    AverageRating = fashionSeller.SellerProfile.AverageRating,
                    TotalProducts = 6
                },
                ImageUrls = ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"]
            },

            // Books - Bookworm Paradise
            new()
            {
                Name = "The Pragmatic Programmer",
                Description = "20th Anniversary Edition. Your journey to mastery. Essential reading for software developers.",
                Price = 44.99m,
                Stock = 50,
                SellerId = bookwormSeller.Id,
                CategoryIds = ["cat-books"],
                Seller = new Seller
                {
                    Id = bookwormSeller.Id,
                    DisplayName = bookwormSeller.SellerProfile!.StoreName,
                    Email = bookwormSeller.Email,
                    AverageRating = bookwormSeller.SellerProfile.AverageRating,
                    TotalProducts = 5
                },
                ImageUrls = ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800"]
            },
            new()
            {
                Name = "Clean Code",
                Description = "A Handbook of Agile Software Craftsmanship by Robert C. Martin. Must-read for programmers.",
                Price = 39.99m,
                Stock = 42,
                SellerId = bookwormSeller.Id,
                CategoryIds = ["cat-books"],
                Seller = new Seller
                {
                    Id = bookwormSeller.Id,
                    DisplayName = bookwormSeller.SellerProfile!.StoreName,
                    Email = bookwormSeller.Email,
                    AverageRating = bookwormSeller.SellerProfile.AverageRating,
                    TotalProducts = 5
                },
                ImageUrls = ["https://images.unsplash.com/photo-1589998059171-988d887df646?w=800"]
            },
            new()
            {
                Name = "Atomic Habits",
                Description = "An Easy & Proven Way to Build Good Habits & Break Bad Ones by James Clear.",
                Price = 27.99m,
                Stock = 75,
                SellerId = bookwormSeller.Id,
                CategoryIds = ["cat-books"],
                Seller = new Seller
                {
                    Id = bookwormSeller.Id,
                    DisplayName = bookwormSeller.SellerProfile!.StoreName,
                    Email = bookwormSeller.Email,
                    AverageRating = bookwormSeller.SellerProfile.AverageRating,
                    TotalProducts = 5
                },
                ImageUrls = ["https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800"]
            },

            // Sports & Outdoors - Outdoor Gear Co
            new()
            {
                Name = "Professional Yoga Mat",
                Description = "Extra thick 6mm yoga mat with carrying strap. Non-slip surface, eco-friendly materials.",
                Price = 34.99m,
                Stock = 65,
                SellerId = outdoorSeller.Id,
                CategoryIds = ["cat-sports"],
                Seller = new Seller
                {
                    Id = outdoorSeller.Id,
                    DisplayName = outdoorSeller.SellerProfile!.StoreName,
                    Email = outdoorSeller.Email,
                    AverageRating = outdoorSeller.SellerProfile.AverageRating,
                    TotalProducts = 4
                },
                ImageUrls = ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800"]
            },
            new()
            {
                Name = "Camping Tent 4-Person",
                Description = "Waterproof family camping tent with easy setup. Includes carry bag and stakes.",
                Price = 149.99m,
                Stock = 20,
                SellerId = outdoorSeller.Id,
                CategoryIds = ["cat-sports"],
                Seller = new Seller
                {
                    Id = outdoorSeller.Id,
                    DisplayName = outdoorSeller.SellerProfile!.StoreName,
                    Email = outdoorSeller.Email,
                    AverageRating = outdoorSeller.SellerProfile.AverageRating,
                    TotalProducts = 4
                },
                ImageUrls = ["https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800"]
            },
            new()
            {
                Name = "Stainless Steel Water Bottle",
                Description = "Insulated 32oz water bottle keeps drinks cold for 24hrs, hot for 12hrs. BPA-free.",
                Price = 29.99m,
                Stock = 100,
                SellerId = outdoorSeller.Id,
                CategoryIds = ["cat-sports"],
                Seller = new Seller
                {
                    Id = outdoorSeller.Id,
                    DisplayName = outdoorSeller.SellerProfile!.StoreName,
                    Email = outdoorSeller.Email,
                    AverageRating = outdoorSeller.SellerProfile.AverageRating,
                    TotalProducts = 4
                },
                ImageUrls = ["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800"]
            }
        };

        foreach (var product in products)
        {
            await _productsRepository.CreateProductAsync(product, cancellationToken);
        }

        return products.Count;
    }
}
