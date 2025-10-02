# Cosmos DB Partition Strategy

## Overview

This marketplace application uses a **Primary Strategy** partition design optimized for query performance and cost efficiency. The design follows Cosmos DB best practices with carefully chosen partition keys based on access patterns.

## Container Design

### 1. Products Container

- **Partition Key**: `/sellerId`
- **Container Name**: `products`
- **Rationale**:
  - Most product queries are seller-specific (seller dashboard, inventory management)
  - Enables efficient single-partition queries for seller operations
  - Products are tightly coupled to their seller
- **Indexing Policy**: Optimized for categoryIds array searches

**Document Structure**:

```json
{
  "id": "product-guid",
  "sellerId": "seller-guid", // PARTITION KEY
  "name": "Product Name",
  "description": "...",
  "price": 99.99,
  "currency": "USD",
  "stock": 100,
  "categoryIds": ["electronics", "laptops"], // Multiple categories
  "seller": {
    "id": "seller-guid",
    "displayName": "Seller Name",
    "email": "seller@example.com"
  },
  "imageUrls": ["https://..."],
  "createdAt": "2025-10-03T...",
  "updatedAt": "2025-10-03T...",
  "type": "Product"
}
```

**Efficient Queries** (Single Partition):

- Get all products by seller: `3-5 RUs`
- Get specific product by seller: `1 RU` (point read)
- Update/Delete seller's products: `1 RU` per operation

**Cross-Partition Queries** (More expensive):

- Products by category: Consider materialized view via Change Feed
- Global product search: Integrate Azure Cognitive Search

---

### 2. Orders Container

- **Partition Key**: `/userId`
- **Container Name**: `orders`
- **Rationale**:
  - Users query their own order history frequently
  - Single-partition reads for "My Orders" page
  - Order status tracking per user is highly efficient

**Document Structure**:

```json
{
  "id": "order-guid",
  "userId": "user-guid", // PARTITION KEY
  "orderDate": "2025-10-03T...",
  "status": "shipped",
  "items": [
    {
      "productId": "product-guid",
      "productName": "Laptop", // Denormalized
      "imageUrl": "https://...", // Denormalized
      "sellerId": "seller-guid",
      "sellerName": "John's Store", // Denormalized
      "quantity": 2,
      "unitPrice": 999.99, // Historical price
      "lineTotal": 1999.98
    }
  ],
  "subtotal": 1999.98,
  "shippingCost": 15.0,
  "total": 2014.98,
  "currency": "USD",
  "type": "Order"
}
```

**Benefits**:

- User order history: `3-5 RUs`
- Point read order: `1 RU`
- No joins needed (denormalized product data)

---

### 3. Carts Container

- **Partition Key**: `/userId`
- **Container Name**: `carts`
- **Special Design**: `id = userId` for ultra-efficient point reads
- **Rationale**:
  - One cart per user (1:1 relationship)
  - Cart operations are always user-specific
  - Maximum efficiency for most frequent operation

**Document Structure**:

```json
{
  "id": "user-guid", // SAME AS userId for point reads!
  "userId": "user-guid", // PARTITION KEY
  "lastUpdatedAt": "2025-10-03T...",
  "items": [
    {
      "productId": "product-guid",
      "productName": "Laptop", // Denormalized
      "imageUrl": "https://...", // Denormalized
      "sellerId": "seller-guid",
      "sellerName": "John's Store", // Denormalized
      "quantity": 2,
      "unitPrice": 999.99,
      "lineTotal": 1999.98,
      "addedDate": "2025-10-01T..."
    }
  ],
  "subtotal": 1999.98,
  "total": 1999.98,
  "currency": "USD",
  "type": "Cart"
}
```

**Ultra-Efficient Operations**:

- Get user cart: `1 RU` (point read with id + partition key)
- Update cart: `1 RU` (upsert)

**TTL Recommendation**: Set 30-day TTL for abandoned carts

---

### 4. Users Container

- **Partition Key**: `/id`
- **Container Name**: `users`
- **Rationale**:
  - Direct lookups by user ID (authentication, profile)
  - Small dataset with simple partitioning
  - Supports both buyer and seller profiles

**Document Structure**:

```json
{
  "id": "user-guid", // PARTITION KEY
  "email": "user@example.com",
  "name": "John Doe",
  "phoneNumber": "+1234567890",
  "roles": ["buyer", "seller"],
  "sellerProfile": {
    "storeName": "John's Electronics",
    "storeDescription": "...",
    "logoUrl": "https://...",
    "averageRating": 4.8,
    "totalProducts": 45, // Updated via Change Feed
    "totalOrders": 150, // Updated via Change Feed
    "totalReviews": 89,
    "lastProductAddedAt": "2025-10-02T...",
    "isVerified": true
  },
  "shippingAddresses": [
    {
      "id": "address-guid",
      "fullName": "John Doe",
      "addressLine1": "123 Main St",
      "city": "New York",
      "stateOrProvince": "NY",
      "postalCode": "10001",
      "country": "USA",
      "phoneNumber": "+1234567890",
      "isDefault": true
    }
  ],
  "createdAt": "2025-01-01T...",
  "lastLoginAt": "2025-10-03T...",
  "type": "User"
}
```

**Efficient Operations**:

- Get user by ID: `1 RU` (point read)
- Update user profile: `1 RU`

**Note**: Email lookups are cross-partition. Consider secondary index or caching for frequent email-based authentication.

---

### 5. Categories Container

- **Partition Key**: `/id`
- **Container Name**: `categories`
- **Rationale**:
  - Small, relatively static dataset
  - Infrequent writes, high read volume
  - Perfect for caching
  - Supports hierarchical categories

**Document Structure**:

```json
{
  "id": "electronics", // PARTITION KEY (use slug as id)
  "name": "Electronics",
  "slug": "electronics",
  "description": "All electronic products",
  "parentCategoryId": null, // Top-level category
  "subcategoryIds": ["laptops", "phones", "tablets"],
  "type": "Category"
}
```

**Caching Strategy**: Cache all categories in memory with 24-hour expiration.

---

## Query Performance Summary

| Query                | Container  | Partition | RU Cost    | Type               |
| -------------------- | ---------- | --------- | ---------- | ------------------ |
| Get user cart        | Carts      | userId    | ~1 RU      | Point read         |
| Get user orders      | Orders     | userId    | ~3-5 RUs   | Single partition   |
| Get seller products  | Products   | sellerId  | ~3-5 RUs   | Single partition   |
| Get user profile     | Users      | id        | ~1 RU      | Point read         |
| Get category         | Categories | id        | ~1 RU      | Point read         |
| All categories       | Categories | N/A       | ~3-5 RUs   | Full scan (cached) |
| Products by category | Products   | N/A       | ~10-50 RUs | Cross-partition    |

---

## Denormalization Strategy

### Why Denormalize?

Cosmos DB is designed for denormalized data to minimize cross-container queries and optimize read performance.

### What to Denormalize:

1. **Order Items** → Snapshot product details at time of purchase
   - Product name, price, seller info
   - Historical accuracy (prices change over time)
2. **Cart Items** → Current product details

   - Product name, current price, seller info
   - Faster cart display without joins

3. **Users** → Aggregate seller statistics
   - Total products, orders, ratings
   - Updated via Change Feed or scheduled jobs

---

## Advanced Optimizations

### 1. Materialized Views via Change Feed

For cross-partition queries like "products by category", create a materialized view:

```csharp
// Listen to Products container changes
// Write to a separate container partitioned by categoryId
public class ProductCategoryMaterializer
{
    public async Task ProcessChangesAsync(
        IReadOnlyCollection<Product> changes)
    {
        foreach (var product in changes)
        {
            // For each category the product belongs to
            foreach (var categoryId in product.CategoryIds)
            {
                var materializedView = new
                {
                    Id = product.Id,
                    CategoryId = categoryId,  // New partition key
                    Product = product
                };

                await _materializedViewContainer.UpsertItemAsync(
                    materializedView,
                    new PartitionKey(categoryId));
            }
        }
    }
}
```

### 2. Azure Cognitive Search Integration

For full-text product search and advanced filtering:

- Index products in Azure Cognitive Search
- Use for: search, filtering, faceting
- Cosmos DB for: transactional operations

### 3. Caching Strategy

```csharp
public class CategoryCacheService
{
    private readonly IMemoryCache _cache;
    private const string CacheKey = "all_categories";

    public async Task<IEnumerable<Category>> GetAllCategoriesAsync()
    {
        if (!_cache.TryGetValue(CacheKey, out List<Category>? categories))
        {
            categories = await _repository.GetCategoriesAsync();
            _cache.Set(CacheKey, categories, TimeSpan.FromHours(24));
        }
        return categories!;
    }
}
```

---

## Cost Optimization Tips

1. **Use Shared Throughput** across containers (recommended for dev/test)
2. **Optimize Indexing Policy**:
   ```json
   {
     "indexingMode": "consistent",
     "excludedPaths": [{ "path": "/description/*" }, { "path": "/imageUrls/*" }]
   }
   ```
3. **Implement TTL** for abandoned carts (30 days)
4. **Batch Operations** when possible
5. **Point Reads** wherever possible (id + partition key)

---

## Container Initialization

Run the initialization script to create containers with proper partition keys:

```bash
cd backend/Api
dotnet run -- init-cosmos
```

Or manually create containers in Azure Portal with these settings:

- Products: partition key `/sellerId`
- Orders: partition key `/userId`
- Carts: partition key `/userId`
- Users: partition key `/id`
- Categories: partition key `/id`

**Shared Throughput**: 400 RU/s (minimum) shared across all containers
