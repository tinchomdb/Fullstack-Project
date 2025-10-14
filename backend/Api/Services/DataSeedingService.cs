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
        //early return for not seeding data every time
        return;
        Console.WriteLine("Starting data seeding...");

        // Clear existing data for fresh seeding (portfolio project)
        Console.WriteLine("Clearing existing data...");
        await ClearExistingDataAsync(cancellationToken);
        Console.WriteLine("✓ Existing data cleared");

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

    private async Task ClearExistingDataAsync(CancellationToken cancellationToken)
    {
        Console.WriteLine("Deleting existing products...");
        var existingProducts = await _productsRepository.GetAllProductsAsync(cancellationToken);
        foreach (var product in existingProducts)
        {
            await _productsRepository.DeleteProductAsync(product.Id, product.SellerId, cancellationToken);
        }
        Console.WriteLine($"Deleted {existingProducts.Count} products");

        Console.WriteLine("Deleting existing categories...");
        var existingCategories = await _categoriesRepository.GetCategoriesAsync(cancellationToken);
        foreach (var category in existingCategories)
        {
            await _categoriesRepository.DeleteCategoryAsync(category.Id, cancellationToken);
        }
        Console.WriteLine($"Deleted {existingCategories.Count} categories");
        
        Console.WriteLine("Note: Users are not deleted. Please manually delete from Azure Cosmos DB if needed.");
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
                Slug = "food-beverages",
                Description = "Gourmet food, snacks, and drinks",
                Image = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400"
            },
            new()
            {
                Id = "cat-coffee-tea",
                Name = "Coffee & Tea",
                Slug = "coffee-tea",
                Description = "Premium coffee and tea selections",
                ParentCategoryId = "cat-food",
                Image = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400"
            },
            // Jewelry & Watches
            new()
            {
                Id = "cat-jewelry",
                Name = "Jewelry & Watches",
                Slug = "jewelry-watches",
                Description = "Fine jewelry and timepieces",
                Image = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400"
            },
            new()
            {
                Id = "cat-watches",
                Name = "Watches",
                Slug = "watches",
                Description = "Luxury and casual watches",
                ParentCategoryId = "cat-jewelry",
                Image = "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400"
            },
            // Health & Fitness
            new()
            {
                Id = "cat-health-fitness",
                Name = "Health & Fitness",
                Slug = "health-fitness",
                Description = "Fitness equipment and health products",
                Image = "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400"
            },
            new()
            {
                Id = "cat-fitness-equipment",
                Name = "Fitness Equipment",
                Slug = "fitness-equipment",
                Description = "Home gym and workout equipment",
                ParentCategoryId = "cat-health-fitness",
                Image = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"
            },
            // Music & Instruments
            new()
            {
                Id = "cat-music",
                Name = "Musical Instruments",
                Slug = "musical-instruments",
                Description = "Guitars, keyboards, and music accessories",
                Image = "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400"
            },
            new()
            {
                Id = "cat-guitars",
                Name = "Guitars",
                Slug = "guitars",
                Description = "Acoustic and electric guitars",
                ParentCategoryId = "cat-music",
                Image = "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400"
            },
            // Kitchen & Dining
            new()
            {
                Id = "cat-kitchen",
                Name = "Kitchen & Dining",
                Slug = "kitchen-dining",
                Description = "Cookware, appliances, and dining essentials",
                Image = "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400"
            },
            new()
            {
                Id = "cat-cookware",
                Name = "Cookware",
                Slug = "cookware",
                Description = "Pots, pans, and cooking tools",
                ParentCategoryId = "cat-kitchen",
                Image = "https://images.unsplash.com/photo-1584990347449-39b14e22c31e?w=400"
            },
            // Video Games
            new()
            {
                Id = "cat-gaming",
                Name = "Video Games",
                Slug = "video-games",
                Description = "Gaming consoles, games, and accessories",
                ParentCategoryId = "cat-electronics",
                Image = "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400",
                Featured = true
            },
            new()
            {
                Id = "cat-gaming-consoles",
                Name = "Gaming Consoles",
                Slug = "gaming-consoles",
                Description = "PlayStation, Xbox, Nintendo consoles",
                ParentCategoryId = "cat-gaming",
                Image = "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400"
            },
            new()
            {
                Id = "cat-gaming-accessories",
                Name = "Gaming Accessories",
                Slug = "gaming-accessories",
                Description = "Controllers, headsets, and gaming gear",
                ParentCategoryId = "cat-gaming",
                Image = "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400"
            },
            // Cameras & Photography
            new()
            {
                Id = "cat-cameras",
                Name = "Cameras & Photography",
                Slug = "cameras-photography",
                Description = "Cameras, lenses, and photography equipment",
                ParentCategoryId = "cat-electronics",
                Image = "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400"
            },
            // Audio
            new()
            {
                Id = "cat-audio",
                Name = "Audio",
                Slug = "audio",
                Description = "Headphones, speakers, and audio equipment",
                ParentCategoryId = "cat-electronics",
                Image = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
            },
            new()
            {
                Id = "cat-headphones",
                Name = "Headphones",
                Slug = "headphones",
                Description = "Over-ear, in-ear, and wireless headphones",
                ParentCategoryId = "cat-audio",
                Image = "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400"
            },
            new()
            {
                Id = "cat-speakers",
                Name = "Speakers",
                Slug = "speakers",
                Description = "Bluetooth and smart speakers",
                ParentCategoryId = "cat-audio",
                Image = "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"
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
            },
            new()
            {
                Id = "seller-beauty",
                Email = "hello@beautyhaven.com",
                Name = "Beauty Haven",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Beauty Haven",
                    StoreDescription = "Premium beauty and skincare products",
                    AverageRating = 4.8m,
                    TotalProducts = 0,
                    TotalOrders = 203,
                    TotalReviews = 176
                }
            },
            new()
            {
                Id = "seller-toysrus",
                Email = "contact@toysrus.com",
                Name = "Toys R Us",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Toys R Us",
                    StoreDescription = "The ultimate toy store for kids of all ages",
                    AverageRating = 4.6m,
                    TotalProducts = 0,
                    TotalOrders = 421,
                    TotalReviews = 356
                }
            },
            new()
            {
                Id = "seller-autoparts",
                Email = "info@autopartsplus.com",
                Name = "AutoParts Plus",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "AutoParts Plus",
                    StoreDescription = "Quality car parts and accessories",
                    AverageRating = 4.4m,
                    TotalProducts = 0,
                    TotalOrders = 187,
                    TotalReviews = 143
                }
            },
            new()
            {
                Id = "seller-officemax",
                Email = "support@officemax.com",
                Name = "OfficeMax",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "OfficeMax",
                    StoreDescription = "Complete office solutions and supplies",
                    AverageRating = 4.3m,
                    TotalProducts = 0,
                    TotalOrders = 312,
                    TotalReviews = 267
                }
            },
            new()
            {
                Id = "seller-petco",
                Email = "hello@petco.com",
                Name = "Petco",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Petco",
                    StoreDescription = "Everything your pet needs and more",
                    AverageRating = 4.7m,
                    TotalProducts = 0,
                    TotalOrders = 523,
                    TotalReviews = 445
                }
            },
            new()
            {
                Id = "seller-gourmet",
                Email = "info@gourmetfoods.com",
                Name = "Gourmet Foods",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Gourmet Foods",
                    StoreDescription = "Premium food and beverage selections",
                    AverageRating = 4.8m,
                    TotalProducts = 0,
                    TotalOrders = 267,
                    TotalReviews = 221
                }
            },
            new()
            {
                Id = "seller-jewelry",
                Email = "contact@jewelrygallery.com",
                Name = "Jewelry Gallery",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Jewelry Gallery",
                    StoreDescription = "Fine jewelry and luxury watches",
                    AverageRating = 4.9m,
                    TotalProducts = 0,
                    TotalOrders = 156,
                    TotalReviews = 134
                }
            },
            new()
            {
                Id = "seller-fitness",
                Email = "support@fitnessworld.com",
                Name = "Fitness World",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Fitness World",
                    StoreDescription = "Home gym equipment and fitness gear",
                    AverageRating = 4.6m,
                    TotalProducts = 0,
                    TotalOrders = 289,
                    TotalReviews = 234
                }
            },
            new()
            {
                Id = "seller-music",
                Email = "hello@musicstore.com",
                Name = "Music Store",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Music Store",
                    StoreDescription = "Quality musical instruments and accessories",
                    AverageRating = 4.7m,
                    TotalProducts = 0,
                    TotalOrders = 198,
                    TotalReviews = 167
                }
            },
            new()
            {
                Id = "seller-kitchen",
                Email = "info@kitchenpro.com",
                Name = "Kitchen Pro",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "Kitchen Pro",
                    StoreDescription = "Professional cookware and kitchen essentials",
                    AverageRating = 4.8m,
                    TotalProducts = 0,
                    TotalOrders = 342,
                    TotalReviews = 298
                }
            },
            new()
            {
                Id = "seller-gamestop",
                Email = "contact@gamestop.com",
                Name = "GameStop",
                Roles = ["buyer", "seller"],
                SellerProfile = new SellerProfile
                {
                    StoreName = "GameStop",
                    StoreDescription = "The world's largest video game retailer",
                    AverageRating = 4.5m,
                    TotalProducts = 0,
                    TotalOrders = 876,
                    TotalReviews = 712
                }
            }
        };

        foreach (var seller in sellers)
        {
            var existingUser = await _usersRepository.GetUserAsync(seller.Id, cancellationToken);
            if (existingUser == null)
            {
                await _usersRepository.CreateUserAsync(seller, cancellationToken);
            }
            else
            {
                Console.WriteLine($"Seller {seller.Id} already exists, skipping...");
            }
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
        var beautySeller = sellers.First(s => s.Id == "seller-beauty");
        var toysSeller = sellers.First(s => s.Id == "seller-toysrus");
        var autoSeller = sellers.First(s => s.Id == "seller-autoparts");
        var officeSeller = sellers.First(s => s.Id == "seller-officemax");
        var petSeller = sellers.First(s => s.Id == "seller-petco");
        var gourmetSeller = sellers.First(s => s.Id == "seller-gourmet");
        var jewelrySeller = sellers.First(s => s.Id == "seller-jewelry");
        var fitnessSeller = sellers.First(s => s.Id == "seller-fitness");
        var musicSeller = sellers.First(s => s.Id == "seller-music");
        var kitchenSeller = sellers.First(s => s.Id == "seller-kitchen");
        var gameSeller = sellers.First(s => s.Id == "seller-gamestop");

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
                ImageUrls = ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800"],
                Featured = true
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
                ImageUrls = ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800"],
                Featured = true
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
                ImageUrls = ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800"],
                Featured = true
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
            },

            // Beauty & Personal Care - Beauty Haven
            new()
            {
                Name = "Luxury Face Serum",
                Description = "Anti-aging face serum with hyaluronic acid and vitamin C. Reduces fine lines and brightens skin.",
                Price = 89.99m,
                Stock = 45,
                SellerId = beautySeller.Id,
                CategoryIds = ["cat-beauty", "cat-skincare"],
                Seller = new Seller { Id = beautySeller.Id, DisplayName = beautySeller.SellerProfile!.StoreName, Email = beautySeller.Email, AverageRating = beautySeller.SellerProfile.AverageRating, TotalProducts = 12 },
                ImageUrls = ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Matte Liquid Lipstick Set",
                Description = "Long-lasting matte lipstick collection with 12 vibrant shades. Waterproof and smudge-proof.",
                Price = 34.99m,
                Stock = 62,
                SellerId = beautySeller.Id,
                CategoryIds = ["cat-beauty", "cat-makeup"],
                Seller = new Seller { Id = beautySeller.Id, DisplayName = beautySeller.SellerProfile!.StoreName, Email = beautySeller.Email, AverageRating = beautySeller.SellerProfile.AverageRating, TotalProducts = 12 },
                ImageUrls = ["https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800"]
            },
            new()
            {
                Name = "Organic Moisturizing Cream",
                Description = "Natural face moisturizer with shea butter and aloe vera. Suitable for all skin types.",
                Price = 45.99m,
                Stock = 38,
                SellerId = beautySeller.Id,
                CategoryIds = ["cat-beauty", "cat-skincare"],
                Seller = new Seller { Id = beautySeller.Id, DisplayName = beautySeller.SellerProfile!.StoreName, Email = beautySeller.Email, AverageRating = beautySeller.SellerProfile.AverageRating, TotalProducts = 12 },
                ImageUrls = ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800"]
            },
            new()
            {
                Name = "Professional Makeup Brush Set",
                Description = "18-piece makeup brush collection with premium synthetic bristles and storage case.",
                Price = 59.99m,
                Stock = 27,
                SellerId = beautySeller.Id,
                CategoryIds = ["cat-beauty", "cat-makeup"],
                Seller = new Seller { Id = beautySeller.Id, DisplayName = beautySeller.SellerProfile!.StoreName, Email = beautySeller.Email, AverageRating = beautySeller.SellerProfile.AverageRating, TotalProducts = 12 },
                ImageUrls = ["https://images.unsplash.com/photo-1596704017254-9b121068ec31?w=800"]
            },

            // Toys & Games - Toys R Us
            new()
            {
                Name = "LEGO Star Wars Millennium Falcon",
                Description = "Ultimate Collector Series Millennium Falcon with 7,541 pieces. For advanced builders.",
                Price = 849.99m,
                Stock = 12,
                SellerId = toysSeller.Id,
                CategoryIds = ["cat-toys", "cat-action-figures"],
                Seller = new Seller { Id = toysSeller.Id, DisplayName = toysSeller.SellerProfile!.StoreName, Email = toysSeller.Email, AverageRating = toysSeller.SellerProfile.AverageRating, TotalProducts = 15 },
                ImageUrls = ["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Monopoly Ultimate Edition",
                Description = "Classic Monopoly board game with luxury edition featuring gold-plated pieces.",
                Price = 74.99m,
                Stock = 34,
                SellerId = toysSeller.Id,
                CategoryIds = ["cat-toys", "cat-board-games"],
                Seller = new Seller { Id = toysSeller.Id, DisplayName = toysSeller.SellerProfile!.StoreName, Email = toysSeller.Email, AverageRating = toysSeller.SellerProfile.AverageRating, TotalProducts = 15 },
                ImageUrls = ["https://images.unsplash.com/photo-1566694271453-390536dd1f0d?w=800"]
            },
            new()
            {
                Name = "Remote Control Monster Truck",
                Description = "4WD off-road RC truck with 2.4GHz remote. Speeds up to 30mph.",
                Price = 129.99m,
                Stock = 23,
                SellerId = toysSeller.Id,
                CategoryIds = ["cat-toys"],
                Seller = new Seller { Id = toysSeller.Id, DisplayName = toysSeller.SellerProfile!.StoreName, Email = toysSeller.Email, AverageRating = toysSeller.SellerProfile.AverageRating, TotalProducts = 15 },
                ImageUrls = ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"]
            },
            new()
            {
                Name = "Chess Set Wooden Premium",
                Description = "Handcrafted wooden chess set with felted pieces and storage drawer.",
                Price = 89.99m,
                Stock = 19,
                SellerId = toysSeller.Id,
                CategoryIds = ["cat-toys", "cat-board-games"],
                Seller = new Seller { Id = toysSeller.Id, DisplayName = toysSeller.SellerProfile!.StoreName, Email = toysSeller.Email, AverageRating = toysSeller.SellerProfile.AverageRating, TotalProducts = 15 },
                ImageUrls = ["https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800"]
            },

            // Automotive - AutoParts Plus
            new()
            {
                Name = "Dashboard Camera 4K",
                Description = "4K UHD dash cam with night vision, GPS, and 128GB storage. Front and rear cameras.",
                Price = 199.99m,
                Stock = 41,
                SellerId = autoSeller.Id,
                CategoryIds = ["cat-automotive", "cat-car-accessories"],
                Seller = new Seller { Id = autoSeller.Id, DisplayName = autoSeller.SellerProfile!.StoreName, Email = autoSeller.Email, AverageRating = autoSeller.SellerProfile.AverageRating, TotalProducts = 10 },
                ImageUrls = ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800"]
            },
            new()
            {
                Name = "Car Vacuum Cleaner Portable",
                Description = "High-power cordless car vacuum with HEPA filter and LED light. 120W suction power.",
                Price = 59.99m,
                Stock = 56,
                SellerId = autoSeller.Id,
                CategoryIds = ["cat-automotive", "cat-car-accessories"],
                Seller = new Seller { Id = autoSeller.Id, DisplayName = autoSeller.SellerProfile!.StoreName, Email = autoSeller.Email, AverageRating = autoSeller.SellerProfile.AverageRating, TotalProducts = 10 },
                ImageUrls = ["https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800"]
            },
            new()
            {
                Name = "All-Weather Floor Mats Set",
                Description = "Heavy-duty rubber floor mats for all seasons. Universal fit with anti-slip backing.",
                Price = 69.99m,
                Stock = 48,
                SellerId = autoSeller.Id,
                CategoryIds = ["cat-automotive", "cat-car-accessories"],
                Seller = new Seller { Id = autoSeller.Id, DisplayName = autoSeller.SellerProfile!.StoreName, Email = autoSeller.Email, AverageRating = autoSeller.SellerProfile.AverageRating, TotalProducts = 10 },
                ImageUrls = ["https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=800"]
            },

            // Office Supplies - OfficeMax
            new()
            {
                Name = "Ergonomic Office Chair",
                Description = "Executive mesh office chair with lumbar support, adjustable armrests, and headrest.",
                Price = 299.99m,
                Stock = 31,
                SellerId = officeSeller.Id,
                CategoryIds = ["cat-office"],
                Seller = new Seller { Id = officeSeller.Id, DisplayName = officeSeller.SellerProfile!.StoreName, Email = officeSeller.Email, AverageRating = officeSeller.SellerProfile.AverageRating, TotalProducts = 14 },
                ImageUrls = ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Moleskine Notebook Set",
                Description = "Set of 3 premium ruled notebooks with elastic closure and ribbon bookmark.",
                Price = 44.99m,
                Stock = 72,
                SellerId = officeSeller.Id,
                CategoryIds = ["cat-office", "cat-stationery"],
                Seller = new Seller { Id = officeSeller.Id, DisplayName = officeSeller.SellerProfile!.StoreName, Email = officeSeller.Email, AverageRating = officeSeller.SellerProfile.AverageRating, TotalProducts = 14 },
                ImageUrls = ["https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800"]
            },
            new()
            {
                Name = "Desk Organizer Bamboo",
                Description = "Eco-friendly bamboo desk organizer with compartments for pens, papers, and accessories.",
                Price = 39.99m,
                Stock = 58,
                SellerId = officeSeller.Id,
                CategoryIds = ["cat-office", "cat-stationery"],
                Seller = new Seller { Id = officeSeller.Id, DisplayName = officeSeller.SellerProfile!.StoreName, Email = officeSeller.Email, AverageRating = officeSeller.SellerProfile.AverageRating, TotalProducts = 14 },
                ImageUrls = ["https://images.unsplash.com/photo-1572297794514-31e0217bfcaa?w=800"]
            },
            new()
            {
                Name = "Wireless Keyboard and Mouse Combo",
                Description = "Slim wireless keyboard and mouse set with 2.4GHz connection and long battery life.",
                Price = 54.99m,
                Stock = 44,
                SellerId = officeSeller.Id,
                CategoryIds = ["cat-office", "cat-electronics"],
                Seller = new Seller { Id = officeSeller.Id, DisplayName = officeSeller.SellerProfile!.StoreName, Email = officeSeller.Email, AverageRating = officeSeller.SellerProfile.AverageRating, TotalProducts = 14 },
                ImageUrls = ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800"]
            },

            // Pet Supplies - Petco
            new()
            {
                Name = "Automatic Pet Feeder",
                Description = "Smart pet feeder with app control, portion control, and voice recording. For cats and dogs.",
                Price = 119.99m,
                Stock = 36,
                SellerId = petSeller.Id,
                CategoryIds = ["cat-pets"],
                Seller = new Seller { Id = petSeller.Id, DisplayName = petSeller.SellerProfile!.StoreName, Email = petSeller.Email, AverageRating = petSeller.SellerProfile.AverageRating, TotalProducts = 11 },
                ImageUrls = ["https://images.unsplash.com/photo-1591768575197-9710c8e9583f?w=800"]
            },
            new()
            {
                Name = "Interactive Cat Toy",
                Description = "Automatic rotating feather toy with LED lights. Keeps cats entertained for hours.",
                Price = 24.99m,
                Stock = 89,
                SellerId = petSeller.Id,
                CategoryIds = ["cat-pets", "cat-pet-toys"],
                Seller = new Seller { Id = petSeller.Id, DisplayName = petSeller.SellerProfile!.StoreName, Email = petSeller.Email, AverageRating = petSeller.SellerProfile.AverageRating, TotalProducts = 11 },
                ImageUrls = ["https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800"]
            },
            new()
            {
                Name = "Orthopedic Dog Bed",
                Description = "Memory foam dog bed with washable cover. Extra large size for big dogs.",
                Price = 89.99m,
                Stock = 28,
                SellerId = petSeller.Id,
                CategoryIds = ["cat-pets"],
                Seller = new Seller { Id = petSeller.Id, DisplayName = petSeller.SellerProfile!.StoreName, Email = petSeller.Email, AverageRating = petSeller.SellerProfile.AverageRating, TotalProducts = 11 },
                ImageUrls = ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800"]
            },

            // Food & Beverages - Gourmet Foods
            new()
            {
                Name = "Organic Coffee Bean Collection",
                Description = "Premium selection of 6 single-origin organic coffee beans from around the world.",
                Price = 79.99m,
                Stock = 43,
                SellerId = gourmetSeller.Id,
                CategoryIds = ["cat-food", "cat-coffee-tea"],
                Seller = new Seller { Id = gourmetSeller.Id, DisplayName = gourmetSeller.SellerProfile!.StoreName, Email = gourmetSeller.Email, AverageRating = gourmetSeller.SellerProfile.AverageRating, TotalProducts = 9 },
                ImageUrls = ["https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Artisan Tea Gift Set",
                Description = "Luxury tea collection with 12 premium loose leaf teas and bamboo infuser.",
                Price = 64.99m,
                Stock = 37,
                SellerId = gourmetSeller.Id,
                CategoryIds = ["cat-food", "cat-coffee-tea"],
                Seller = new Seller { Id = gourmetSeller.Id, DisplayName = gourmetSeller.SellerProfile!.StoreName, Email = gourmetSeller.Email, AverageRating = gourmetSeller.SellerProfile.AverageRating, TotalProducts = 9 },
                ImageUrls = ["https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800"]
            },
            new()
            {
                Name = "Gourmet Chocolate Truffle Box",
                Description = "Handcrafted Belgian chocolate truffles in 20 unique flavors. Perfect gift.",
                Price = 49.99m,
                Stock = 51,
                SellerId = gourmetSeller.Id,
                CategoryIds = ["cat-food"],
                Seller = new Seller { Id = gourmetSeller.Id, DisplayName = gourmetSeller.SellerProfile!.StoreName, Email = gourmetSeller.Email, AverageRating = gourmetSeller.SellerProfile.AverageRating, TotalProducts = 9 },
                ImageUrls = ["https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=800"]
            },

            // Jewelry & Watches - Jewelry Gallery
            new()
            {
                Name = "Diamond Stud Earrings",
                Description = "0.5 carat total weight diamond earrings in 14K white gold. Certified conflict-free diamonds.",
                Price = 899.99m,
                Stock = 14,
                SellerId = jewelrySeller.Id,
                CategoryIds = ["cat-jewelry"],
                Seller = new Seller { Id = jewelrySeller.Id, DisplayName = jewelrySeller.SellerProfile!.StoreName, Email = jewelrySeller.Email, AverageRating = jewelrySeller.SellerProfile.AverageRating, TotalProducts = 8 },
                ImageUrls = ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Luxury Swiss Automatic Watch",
                Description = "Men's automatic watch with sapphire crystal, 100m water resistance, and leather strap.",
                Price = 1299.99m,
                Stock = 8,
                SellerId = jewelrySeller.Id,
                CategoryIds = ["cat-jewelry", "cat-watches"],
                Seller = new Seller { Id = jewelrySeller.Id, DisplayName = jewelrySeller.SellerProfile!.StoreName, Email = jewelrySeller.Email, AverageRating = jewelrySeller.SellerProfile.AverageRating, TotalProducts = 8 },
                ImageUrls = ["https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800"]
            },
            new()
            {
                Name = "Sterling Silver Necklace",
                Description = "Elegant sterling silver pendant necklace with cubic zirconia centerpiece.",
                Price = 149.99m,
                Stock = 22,
                SellerId = jewelrySeller.Id,
                CategoryIds = ["cat-jewelry"],
                Seller = new Seller { Id = jewelrySeller.Id, DisplayName = jewelrySeller.SellerProfile!.StoreName, Email = jewelrySeller.Email, AverageRating = jewelrySeller.SellerProfile.AverageRating, TotalProducts = 8 },
                ImageUrls = ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800"]
            },

            // Health & Fitness - Fitness World
            new()
            {
                Name = "Adjustable Dumbbell Set",
                Description = "Space-saving adjustable dumbbells from 5-52.5 lbs per dumbbell. Includes stand.",
                Price = 399.99m,
                Stock = 19,
                SellerId = fitnessSeller.Id,
                CategoryIds = ["cat-health-fitness", "cat-fitness-equipment"],
                Seller = new Seller { Id = fitnessSeller.Id, DisplayName = fitnessSeller.SellerProfile!.StoreName, Email = fitnessSeller.Email, AverageRating = fitnessSeller.SellerProfile.AverageRating, TotalProducts = 13 },
                ImageUrls = ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Smart Fitness Watch",
                Description = "Fitness tracker with heart rate monitor, GPS, sleep tracking, and 50m water resistance.",
                Price = 249.99m,
                Stock = 47,
                SellerId = fitnessSeller.Id,
                CategoryIds = ["cat-health-fitness", "cat-electronics"],
                Seller = new Seller { Id = fitnessSeller.Id, DisplayName = fitnessSeller.SellerProfile!.StoreName, Email = fitnessSeller.Email, AverageRating = fitnessSeller.SellerProfile.AverageRating, TotalProducts = 13 },
                ImageUrls = ["https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800"]
            },
            new()
            {
                Name = "Resistance Bands Set",
                Description = "Professional resistance bands with 5 different resistance levels and carrying bag.",
                Price = 29.99m,
                Stock = 93,
                SellerId = fitnessSeller.Id,
                CategoryIds = ["cat-health-fitness", "cat-fitness-equipment"],
                Seller = new Seller { Id = fitnessSeller.Id, DisplayName = fitnessSeller.SellerProfile!.StoreName, Email = fitnessSeller.Email, AverageRating = fitnessSeller.SellerProfile.AverageRating, TotalProducts = 13 },
                ImageUrls = ["https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800"]
            },
            new()
            {
                Name = "Folding Treadmill",
                Description = "Compact folding treadmill with 12 programs, LCD display, and Bluetooth speakers.",
                Price = 599.99m,
                Stock = 11,
                SellerId = fitnessSeller.Id,
                CategoryIds = ["cat-health-fitness", "cat-fitness-equipment"],
                Seller = new Seller { Id = fitnessSeller.Id, DisplayName = fitnessSeller.SellerProfile!.StoreName, Email = fitnessSeller.Email, AverageRating = fitnessSeller.SellerProfile.AverageRating, TotalProducts = 13 },
                ImageUrls = ["https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800"]
            },

            // Musical Instruments - Music Store
            new()
            {
                Name = "Acoustic Guitar Bundle",
                Description = "Full-size acoustic guitar with gig bag, tuner, strings, and instructional book.",
                Price = 249.99m,
                Stock = 26,
                SellerId = musicSeller.Id,
                CategoryIds = ["cat-music", "cat-guitars"],
                Seller = new Seller { Id = musicSeller.Id, DisplayName = musicSeller.SellerProfile!.StoreName, Email = musicSeller.Email, AverageRating = musicSeller.SellerProfile.AverageRating, TotalProducts = 10 },
                ImageUrls = ["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800"]
            },
            new()
            {
                Name = "Electric Guitar Stratocaster Style",
                Description = "Professional electric guitar with maple neck, alder body, and 3 single-coil pickups.",
                Price = 599.99m,
                Stock = 14,
                SellerId = musicSeller.Id,
                CategoryIds = ["cat-music", "cat-guitars"],
                Seller = new Seller { Id = musicSeller.Id, DisplayName = musicSeller.SellerProfile!.StoreName, Email = musicSeller.Email, AverageRating = musicSeller.SellerProfile.AverageRating, TotalProducts = 10 },
                ImageUrls = ["https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Digital Piano 88 Keys",
                Description = "Full-size weighted keys digital piano with 128 polyphony and USB MIDI connectivity.",
                Price = 799.99m,
                Stock = 9,
                SellerId = musicSeller.Id,
                CategoryIds = ["cat-music"],
                Seller = new Seller { Id = musicSeller.Id, DisplayName = musicSeller.SellerProfile!.StoreName, Email = musicSeller.Email, AverageRating = musicSeller.SellerProfile.AverageRating, TotalProducts = 10 },
                ImageUrls = ["https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800"]
            },

            // Kitchen & Dining - Kitchen Pro
            new()
            {
                Name = "Stainless Steel Cookware Set",
                Description = "10-piece professional cookware set with tri-ply construction and tempered glass lids.",
                Price = 299.99m,
                Stock = 32,
                SellerId = kitchenSeller.Id,
                CategoryIds = ["cat-kitchen", "cat-cookware"],
                Seller = new Seller { Id = kitchenSeller.Id, DisplayName = kitchenSeller.SellerProfile!.StoreName, Email = kitchenSeller.Email, AverageRating = kitchenSeller.SellerProfile.AverageRating, TotalProducts = 12 },
                ImageUrls = ["https://images.unsplash.com/photo-1584990347449-39b14e22c31e?w=800"]
            },
            new()
            {
                Name = "Stand Mixer Professional",
                Description = "6-quart stand mixer with 10 speeds, stainless steel bowl, and multiple attachments.",
                Price = 379.99m,
                Stock = 18,
                SellerId = kitchenSeller.Id,
                CategoryIds = ["cat-kitchen"],
                Seller = new Seller { Id = kitchenSeller.Id, DisplayName = kitchenSeller.SellerProfile!.StoreName, Email = kitchenSeller.Email, AverageRating = kitchenSeller.SellerProfile.AverageRating, TotalProducts = 12 },
                ImageUrls = ["https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Chef Knife Set Premium",
                Description = "8-piece German steel knife set with wooden block and lifetime warranty.",
                Price = 199.99m,
                Stock = 41,
                SellerId = kitchenSeller.Id,
                CategoryIds = ["cat-kitchen", "cat-cookware"],
                Seller = new Seller { Id = kitchenSeller.Id, DisplayName = kitchenSeller.SellerProfile!.StoreName, Email = kitchenSeller.Email, AverageRating = kitchenSeller.SellerProfile.AverageRating, TotalProducts = 12 },
                ImageUrls = ["https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800"]
            },
            new()
            {
                Name = "Espresso Machine",
                Description = "15-bar espresso machine with milk frother and programmable settings.",
                Price = 449.99m,
                Stock = 23,
                SellerId = kitchenSeller.Id,
                CategoryIds = ["cat-kitchen"],
                Seller = new Seller { Id = kitchenSeller.Id, DisplayName = kitchenSeller.SellerProfile!.StoreName, Email = kitchenSeller.Email, AverageRating = kitchenSeller.SellerProfile.AverageRating, TotalProducts = 12 },
                ImageUrls = ["https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800"]
            },

            // Video Games - GameStop
            new()
            {
                Name = "PlayStation 5",
                Description = "PS5 console with 825GB SSD, 4K gaming, and DualSense wireless controller.",
                Price = 499.99m,
                Stock = 22,
                SellerId = gameSeller.Id,
                CategoryIds = ["cat-gaming", "cat-gaming-consoles"],
                Seller = new Seller { Id = gameSeller.Id, DisplayName = gameSeller.SellerProfile!.StoreName, Email = gameSeller.Email, AverageRating = gameSeller.SellerProfile.AverageRating, TotalProducts = 16 },
                ImageUrls = ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Xbox Series X",
                Description = "Xbox Series X with 1TB SSD, 4K gaming, and Xbox Wireless Controller.",
                Price = 499.99m,
                Stock = 28,
                SellerId = gameSeller.Id,
                CategoryIds = ["cat-gaming", "cat-gaming-consoles"],
                Seller = new Seller { Id = gameSeller.Id, DisplayName = gameSeller.SellerProfile!.StoreName, Email = gameSeller.Email, AverageRating = gameSeller.SellerProfile.AverageRating, TotalProducts = 16 },
                ImageUrls = ["https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Nintendo Switch OLED",
                Description = "Nintendo Switch OLED model with 7-inch vibrant screen and 64GB storage.",
                Price = 349.99m,
                Stock = 35,
                SellerId = gameSeller.Id,
                CategoryIds = ["cat-gaming", "cat-gaming-consoles"],
                Seller = new Seller { Id = gameSeller.Id, DisplayName = gameSeller.SellerProfile!.StoreName, Email = gameSeller.Email, AverageRating = gameSeller.SellerProfile.AverageRating, TotalProducts = 16 },
                ImageUrls = ["https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800"]
            },
            new()
            {
                Name = "Gaming Headset RGB",
                Description = "7.1 surround sound gaming headset with noise-canceling mic and RGB lighting.",
                Price = 89.99m,
                Stock = 67,
                SellerId = gameSeller.Id,
                CategoryIds = ["cat-gaming", "cat-gaming-accessories"],
                Seller = new Seller { Id = gameSeller.Id, DisplayName = gameSeller.SellerProfile!.StoreName, Email = gameSeller.Email, AverageRating = gameSeller.SellerProfile.AverageRating, TotalProducts = 16 },
                ImageUrls = ["https://images.unsplash.com/photo-1599669454699-248893623440?w=800"]
            },
            new()
            {
                Name = "Mechanical Gaming Keyboard",
                Description = "RGB mechanical keyboard with Cherry MX switches and programmable macro keys.",
                Price = 129.99m,
                Stock = 45,
                SellerId = gameSeller.Id,
                CategoryIds = ["cat-gaming", "cat-gaming-accessories"],
                Seller = new Seller { Id = gameSeller.Id, DisplayName = gameSeller.SellerProfile!.StoreName, Email = gameSeller.Email, AverageRating = gameSeller.SellerProfile.AverageRating, TotalProducts = 16 },
                ImageUrls = ["https://images.unsplash.com/photo-1595225476474-87563907a212?w=800"]
            },

            // More Electronics - TechPro (Audio & Cameras)
            new()
            {
                Name = "Sony WH-1000XM5 Headphones",
                Description = "Industry-leading noise-canceling wireless headphones with 30-hour battery life.",
                Price = 399.99m,
                Stock = 33,
                SellerId = techProSeller.Id,
                CategoryIds = ["cat-audio", "cat-headphones"],
                Seller = new Seller { Id = techProSeller.Id, DisplayName = techProSeller.SellerProfile!.StoreName, Email = techProSeller.Email, AverageRating = techProSeller.SellerProfile.AverageRating, TotalProducts = 18 },
                ImageUrls = ["https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800"],
                Featured = true
            },
            new()
            {
                Name = "Apple AirPods Pro 2",
                Description = "Active noise cancellation, Adaptive Transparency, and spatial audio with MagSafe charging.",
                Price = 249.99m,
                Stock = 58,
                SellerId = techProSeller.Id,
                CategoryIds = ["cat-audio", "cat-headphones"],
                Seller = new Seller { Id = techProSeller.Id, DisplayName = techProSeller.SellerProfile!.StoreName, Email = techProSeller.Email, AverageRating = techProSeller.SellerProfile.AverageRating, TotalProducts = 18 },
                ImageUrls = ["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800"]
            },
            new()
            {
                Name = "JBL Bluetooth Speaker",
                Description = "Portable waterproof Bluetooth speaker with 20-hour playtime and powerful bass.",
                Price = 129.99m,
                Stock = 72,
                SellerId = techProSeller.Id,
                CategoryIds = ["cat-audio", "cat-speakers"],
                Seller = new Seller { Id = techProSeller.Id, DisplayName = techProSeller.SellerProfile!.StoreName, Email = techProSeller.Email, AverageRating = techProSeller.SellerProfile.AverageRating, TotalProducts = 18 },
                ImageUrls = ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800"]
            },
            new()
            {
                Name = "Canon EOS R6 Mirrorless Camera",
                Description = "Full-frame 20MP mirrorless camera with 4K 60fps video and in-body stabilization.",
                Price = 2499.99m,
                Stock = 11,
                SellerId = techProSeller.Id,
                CategoryIds = ["cat-cameras"],
                Seller = new Seller { Id = techProSeller.Id, DisplayName = techProSeller.SellerProfile!.StoreName, Email = techProSeller.Email, AverageRating = techProSeller.SellerProfile.AverageRating, TotalProducts = 18 },
                ImageUrls = ["https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800"],
                Featured = true
            },
            new()
            {
                Name = "GoPro Hero 12 Black",
                Description = "Waterproof action camera with 5.3K video, HyperSmooth stabilization, and live streaming.",
                Price = 399.99m,
                Stock = 27,
                SellerId = techProSeller.Id,
                CategoryIds = ["cat-cameras"],
                Seller = new Seller { Id = techProSeller.Id, DisplayName = techProSeller.SellerProfile!.StoreName, Email = techProSeller.Email, AverageRating = techProSeller.SellerProfile.AverageRating, TotalProducts = 18 },
                ImageUrls = ["https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=800"]
            },
            new()
            {
                Name = "Bose Smart Soundbar",
                Description = "Premium soundbar with Dolby Atmos, voice control, and wireless connectivity.",
                Price = 899.99m,
                Stock = 16,
                SellerId = techProSeller.Id,
                CategoryIds = ["cat-audio", "cat-speakers"],
                Seller = new Seller { Id = techProSeller.Id, DisplayName = techProSeller.SellerProfile!.StoreName, Email = techProSeller.Email, AverageRating = techProSeller.SellerProfile.AverageRating, TotalProducts = 18 },
                ImageUrls = ["https://images.unsplash.com/photo-1545127398-14699f92334b?w=800"]
            }
        };

        foreach (var product in products)
        {
            await _productsRepository.CreateProductAsync(product, cancellationToken);
        }

        return products.Count;
    }
}
