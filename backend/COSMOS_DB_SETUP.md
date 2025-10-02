# Azure Cosmos DB Setup Guide - Step by Step (Free Tier & Low Cost)

## Overview

This guide will walk you through setting up Azure Cosmos DB for your marketplace application **optimized for FREE TIER and minimal costs**. Perfect for development, learning, and small-scale production workloads.

## Prerequisites

- Active Azure subscription (Free tier available)
- Azure Portal access
- Basic understanding of NoSQL databases

## 💰 Cost Expectations

- **Free Tier**: 1000 RU/s + 25 GB storage completely FREE (first account only)
- **Beyond Free Tier**: ~$24/month for 400 RU/s + 25 GB
- **This Guide Target**: $0-5/month for development workloads

---

## Step 1: Create Azure Cosmos DB Account

### 1.1 Navigate to Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with your Azure credentials

### 1.2 Create Cosmos DB Resource

1. Click **"Create a resource"** in the left sidebar
2. Search for **"Azure Cosmos DB"**
3. Click **"Create"**

### 1.3 Select API Type

1. Choose **"Azure Cosmos DB for NoSQL"** (formerly SQL API)
   - Best for JSON documents
   - Supports rich querying with SQL-like syntax
   - Excellent .NET SDK support

### 1.4 Configure Basic Settings

**Subscription & Resource Group:**

- Select your Azure subscription
- Create a new Resource Group or select existing (e.g., `rg-marketplace-dev`)
- 💡 **Tip**: Use same resource group for all related resources to simplify management and cleanup

**Account Name:**

- Enter a globally unique name (e.g., `cosmos-marketplace-[yourname]`)
- Use lowercase letters, numbers, and hyphens only
- This will be part of your connection endpoint

**Location:**

- Choose the region closest to your users/application
- 💰 **Cost Tip**: Single region = lower costs. Multi-region significantly increases costs.
- Recommended: Use your primary development region

**Capacity Mode:**

Choose based on your needs:

**Option A: Serverless (RECOMMENDED for variable/low workloads)**

- ✅ **Pay only for what you use** (per request)
- ~$0.28 per million reads, ~$1.40 per million writes
- No minimum throughput charges
- Perfect for development, testing, and variable workloads
- **Best for truly sporadic usage**
- ⚠️ **Note**: Free tier and throughput limits are NOT available with serverless

**Option B: Provisioned Throughput (RECOMMENDED if you want FREE TIER)**

- ✅ **Can use FREE TIER** (1000 RU/s + 25 GB free - first account only)
- Fixed cost even when idle (~$24/month for 400 RU/s, or FREE with free tier)
- Better for consistent workloads
- Throughput limiting available for cost control
- **Best if you have free tier available**

💡 **Recommendation**:

- **Have free tier available?** → Choose **Provisioned Throughput** with free tier = $0/month
- **Already used free tier?** → Choose **Serverless** for pay-per-use = ~$0-5/month for light usage

**Global Distribution:**

- ✅ **Single region only** (to minimize costs)
- ⚠️ Adding regions multiplies costs
- Can add regions later if needed

---

## Step 2: Configure Advanced Settings

⚠️ **IMPORTANT**: Steps 2.1 only appear if you selected **Provisioned Throughput**. If you selected **Serverless**, skip to Step 2.2.

### 2.1 Performance & Scalability (PROVISIONED THROUGHPUT ONLY)

**Apply Free Tier Discount:**

- ✅ **ENABLE THIS** (if available - first account only)
- Provides 1000 RU/s + 25 GB storage **completely FREE**
- 💰 Saves ~$64/month (~$24/month for 1000 RU/s + storage)
- ⚠️ Only available for first Cosmos DB account in subscription
- ⚠️ **This option does NOT appear for Serverless mode**

**Limit Total Account Throughput:**

- ✅ **HIGHLY RECOMMENDED** - Enable this to prevent unexpected costs
- Set to minimum (e.g., 1000 RU/s if using free tier, or 400 RU/s minimum)
- Acts as a cost safety cap
- 💡 **Critical for cost control**
- ⚠️ **This option does NOT appear for Serverless mode**

### 2.2 Networking

**Connectivity Method:**

- ✅ **Public endpoint (all networks)** - FREE and sufficient for development
- **Public endpoint (selected networks)** - For production (still free)
- ⚠️ **Private endpoint** - Adds ~$7.30/month + data costs - **AVOID for low-cost setup**

**For Low-Cost Setup:**

- Select **"Public endpoint (all networks)"**
- You can add IP filtering later for free
- 💰 Avoid private endpoints unless absolutely necessary

### 2.3 Backup Policy

**Backup Policy:**

- ✅ **Periodic** (Default - Recommended for low-cost setup)
  - **FREE** - No additional cost
  - Good for development and small production
  - **Recommended for this guide**
- ⚠️ **Continuous** (Point-in-time restore)
  - Adds significant costs (~20% of throughput cost)
  - Only use for critical production data
  - **AVOID for low-cost setup**

#### Periodic Backup Configuration (When selected)

**Backup Interval:**

- Default: **240 minutes** (4 hours)
- Range: 60-1440 minutes
- 💰 **Cost Tip**:
  - ✅ Use **240+ minutes** for development (fewer backups = less storage)
  - For production, consider **60-120 minutes** for more frequent backups
  - More frequent backups = slightly higher storage costs

**Backup Retention:**

- Default: **8 hours**
- Range: 8-720 hours (30 days)
- 💰 **Cost Tip**:
  - ✅ Use **8 hours** for development (minimum, lowest cost)
  - For production, consider **48-168 hours** (2-7 days)
  - Longer retention = higher storage costs

**Copies of Data Retained:**

- Default: **2 copies**
- Fixed at 2 copies (cannot be changed)
- Each backup interval creates 2 redundant copies

**Backup Storage Redundancy:**

Choose based on your disaster recovery needs:

1. **Locally-redundant backup storage (LRS)** ✅ **RECOMMENDED for low-cost**

   - ✅ **Lowest cost** (~$0.05/GB/month)
   - 3 copies within single datacenter
   - Protects against disk/rack failures
   - **Best for development and non-critical workloads**
   - 💰 **Cost Impact**: Base cost

2. **Zone-redundant backup storage (ZRS)**

   - ~3x cost of LRS (~$0.15/GB/month)
   - Copies across multiple availability zones
   - Protects against datacenter failures
   - Use for production in single region
   - 💰 **Cost Impact**: +200% vs LRS

3. **Geo-redundant backup storage (GRS)** ⚠️ **Avoid for low-cost setup**
   - ~2x cost of LRS (~$0.10/GB/month)
   - Copies to paired region (hundreds of miles away)
   - Protects against regional disasters
   - Only needed for mission-critical data
   - 💰 **Cost Impact**: +100% vs LRS

#### Recommended Configuration for Low-Cost Setup

```
Backup Policy:        Periodic
Backup Interval:      240 minutes (4 hours) ✅
Backup Retention:     8 hours ✅
Copies Retained:      2 (fixed)
Storage Redundancy:   Locally-redundant (LRS) ✅
```

**Expected Backup Costs:**

- Development (LRS, 8hr retention): ~$0-1/month (negligible for small data)
- Production (ZRS, 7 days retention): ~$5-15/month depending on data size

💡 **Pro Tip**: You can restore from any backup within the retention period. For cost optimization:

- Keep retention short during development
- Increase retention as you approach production
- Monitor backup storage size in Azure Portal (FREE)

### 2.4 Security

#### Key-based Authentication

Azure Cosmos DB supports both key-based authentication (account keys) and Microsoft Entra ID (formerly Azure AD) authentication.

**Key-based Authentication:**

- Uses account keys (Primary/Secondary) that grant full access to the account
- Simple to set up and use
- Keys provide complete access to all data and operations
- Good for development and initial setup

**Options:**

1. **Enable** ✅ **RECOMMENDED for development**

   - Simple authentication using connection strings
   - Easy to test locally
   - Use with User Secrets for security
   - **Best for this guide**

2. **Disable** (Entra ID only)
   - More secure - uses identity-based access
   - Requires Azure RBAC configuration
   - Better for production with strict security requirements
   - More complex initial setup
   - ⚠️ **Can complicate local development**

💡 **Recommendation for Low-Cost Setup**:

- ✅ **Enable** key-based auth for easier development
- Store keys securely in User Secrets or Azure Key Vault
- Consider disabling for production and using Managed Identity

#### Data Encryption

Azure Cosmos DB automatically encrypts all data at rest. Choose your encryption key management:

**Options:**

1. **Service-managed key** ✅ **RECOMMENDED for low-cost**

   - ✅ **FREE** - No additional cost
   - Azure manages encryption keys automatically
   - Keys rotated automatically by Microsoft
   - Meets most compliance requirements
   - **Best for this guide**
   - 💰 **Cost Impact**: $0

2. **Customer-managed key (CMK)** ⚠️ **Avoid for low-cost setup**
   - Requires Azure Key Vault (~$0.03 per 10k operations)
   - You control key lifecycle and rotation
   - Additional compliance/regulatory scenarios
   - More complex management
   - ⚠️ **IMPORTANT**: Cannot switch back to service-managed after account creation
   - 💰 **Cost Impact**: +$3-10/month (Key Vault costs)

**Recommendation**: Use **service-managed key** unless you have specific regulatory requirements for customer-managed encryption keys.

---

## Step 3: Review and Create

1. Click **"Review + create"**
2. Review all settings
3. Click **"Create"**
4. Wait 5-10 minutes for deployment to complete

---

## Step 4: Create Database and Containers

### 4.1 Navigate to Data Explorer

1. Go to your Cosmos DB account
2. Click **"Data Explorer"** in left menu

### 4.2 Create Database

1. Click **"New Database"**
2. Database ID: `MarketplaceDB`
3. **Throughput Options:**

   **If using SERVERLESS (Recommended for low-cost):**

   - ✅ No throughput configuration needed
   - Pay per request only
   - **Proceed without selecting throughput**

   **If using PROVISIONED THROUGHPUT with Free Tier:**

   - Choose **"Manual"** - Fixed RU/s
   - Set to **400 RU/s** (minimum) or use free tier 1000 RU/s
   - ⚠️ **Avoid Autoscale** - It's more expensive and has 1000 RU/s minimum
   - ✅ **Enable "Share throughput across containers"** - Saves costs

4. Click **"OK"**

💰 **Cost Impact**:

- Serverless: ~$0.28 per million reads, ~$1.40 per million writes
- Manual 400 RU/s: ~$24/month (but FREE if using free tier up to 1000 RU/s)

### 4.3 Create Containers (Collections)

#### Container 1: Products

1. Click **"New Container"**
2. **Database**: Select "Use existing" → `MarketplaceDB`
3. **Container ID**: `Products`
4. **Partition key**: `/categoryId`
   - Enables horizontal scaling
   - Groups related products together
5. **Throughput**:
   - ✅ **Serverless**: No configuration needed
   - ✅ **Provisioned**: Select **"Share database throughput"** (saves costs)
6. Click **"OK"**

#### Container 2: Carts

1. Create new container
2. **Container ID**: `Carts`
3. **Partition key**: `/userId`
   - Each user's cart isolated
   - Efficient single-partition queries
4. **Throughput**:
   - ✅ **Share database throughput** (if provisioned)
5. Click **"OK"**

#### Container 3: Orders

1. Create new container
2. **Container ID**: `Orders`
3. **Partition key**: `/userId`
   - Query all orders by user efficiently
   - Consider `/orderDate` for time-series queries
4. **Throughput**:
   - ✅ **Share database throughput** (if provisioned)
5. Click **"OK"**

#### Container 4: Categories

1. Create new container
2. **Container ID**: `Categories`
3. **Partition key**: `/id`
   - Small dataset, simple partitioning
4. **Throughput**:
   - ✅ **Share database throughput** (if provisioned)
5. Click **"OK"**

💰 **Cost Tip**: Always share throughput across containers when using provisioned mode. Dedicated throughput per container multiplies costs.

---

## Step 5: Configure Indexing Policy (Optimization)

### 5.1 Optimize Products Container

1. Select **Products** container
2. Go to **"Settings"** → **"Indexing Policy"**
3. Update indexing for common queries:

```json
{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [
    {
      "path": "/name/?"
    },
    {
      "path": "/categoryId/?"
    },
    {
      "path": "/price/?"
    },
    {
      "path": "/stock/?"
    }
  ],
  "excludedPaths": [
    {
      "path": "/description/?"
    },
    {
      "path": "/_etag/?"
    }
  ]
}
```

**Benefits:**

- Faster writes (excluded paths)
- 💰 **Lower RU costs** - Reduces request charges
- Optimized for your query patterns
- Can save 20-30% on query costs

💡 **Important for Serverless**: Optimizing indexing is crucial as you pay per request. Excluding unnecessary paths directly reduces costs.

---

## Step 6: Get Connection Information

### 6.1 Retrieve Connection Strings

1. Go to your Cosmos DB account
2. Click **"Keys"** in left menu
3. Note down:
   - **URI** (Endpoint)
   - **PRIMARY KEY** (or Secondary Key)
   - **PRIMARY CONNECTION STRING**

### 6.2 Connection String Format

```
AccountEndpoint=https://[your-account-name].documents.azure.com:443/;AccountKey=[your-key];
```

**Security Best Practices:**

- Use **Azure Key Vault** to store keys in production
- Never commit keys to source control
- Use **Managed Identity** when running in Azure
- Rotate keys periodically

---

## Step 7: Configure Monitoring (Cost-Conscious Approach)

### 7.1 Enable Diagnostic Settings (Optional - Adds Costs)

⚠️ **Cost Warning**: Diagnostic logs add storage and Log Analytics costs (~$2-10/month depending on volume)

**For LOW-COST setup:**

- ✅ **Skip diagnostic settings initially**
- Use built-in Metrics (FREE) in Azure Portal
- Enable only when troubleshooting issues

**If needed:**

1. Go to **"Diagnostic settings"**
2. Click **"Add diagnostic setting"**
3. Send to **Storage Account** (cheaper than Log Analytics)
4. Enable only critical logs:
   - **DataPlaneRequests** (most useful)
   - Skip query statistics to save costs

### 7.2 Set Up Alerts (FREE)

✅ **Cost-Free Monitoring**: Use basic metric alerts (no additional charge)

1. Go to **"Alerts"**
2. Create FREE metric alerts for:
   - **High RU consumption** (> 80% of provisioned)
   - **Throttled requests** (429 errors)
   - **Total Request Units** (serverless cost monitoring)

💰 **Tip**: Use Azure Portal's built-in metrics dashboard - it's completely FREE and sufficient for most scenarios.

---

## Best Practices Summary

### Partition Key Selection

✅ **Choose partition keys that:**

- Distribute data evenly
- Support your most common queries
- Avoid hot partitions
- Have high cardinality

### Throughput Management (Cost-Optimized)

✅ **Recommendations:**

- **Start with SERVERLESS** - Pay only for usage (best for low-cost)
- If using provisioned: Start with **manual 400 RU/s** (not autoscale)
- ✅ **Always use shared throughput** across containers
- Monitor FREE metrics and adjust only when needed
- ⚠️ Avoid autoscale - Minimum 1000 RU/s (~$58/month vs $24/month for manual)

### Security

✅ **Implement:**

- Use Azure Key Vault for secrets
- Enable firewall rules
- Use private endpoints in production
- Implement Managed Identity when possible
- Enable role-based access control (RBAC)

### Cost Optimization (Maximum Savings)

✅ **FREE TIER Strategy:**

1. **Use first Cosmos DB account** to get free tier (1000 RU/s + 25 GB)
2. Set capacity mode to **Serverless** (or provisioned with free tier)
3. **Single region only** (multi-region multiplies costs)
4. **Shared throughput** across all containers
5. Optimize indexing policies aggressively

✅ **Low-Cost Practices:**

- Use **TTL** to auto-delete old data (saves storage costs)
- Optimize queries to reduce RU consumption
- Exclude unnecessary properties from indexing
- Avoid cross-partition queries (costs more RUs)
- Use **point reads** when possible (1 RU vs. 3-5 RUs for queries)
- Batch operations when possible
- Consider archiving old data to Azure Blob Storage (~$0.18/GB/month vs Cosmos)

💰 **Cost Comparison:**

- **Serverless**: ~$0-5/month for development workloads
- **Provisioned 400 RU/s**: ~$24/month (or FREE with free tier up to 1000 RU/s)
- **Autoscale 1000-4000 RU/s**: ~$58-234/month ⚠️

### Data Modeling

✅ **NoSQL Best Practices:**

- Denormalize data for read performance
- Embed related data in same document
- Use partition key in queries to avoid cross-partition queries
- Keep document size reasonable (< 2 MB)
- Use change feed for reactive patterns

---

## Connection Configuration for .NET

After completing the Azure setup, configure your application:

### appsettings.json

```json
{
  "CosmosDb": {
    "Account": "https://[your-account-name].documents.azure.com:443/",
    "Key": "STORED_IN_AZURE_KEY_VAULT_OR_USER_SECRETS",
    "DatabaseName": "MarketplaceDB",
    "ContainersNames": {
      "Products": "Products",
      "Carts": "Carts",
      "Orders": "Orders",
      "Categories": "Categories"
    }
  }
}
```

### For Local Development (User Secrets)

```bash
dotnet user-secrets set "CosmosDb:Key" "YOUR_PRIMARY_KEY_HERE"
```

---

## Next Steps

1. ✅ Complete Azure setup (Steps 1-6)
2. 🔄 Configure your .NET application to connect
3. 🔄 Implement repository pattern with Cosmos DB SDK
4. 🔄 Test connection and basic CRUD operations
5. 📊 Monitor FREE metrics and optimize queries to reduce RU consumption

## 💰 Cost Monitoring Checklist

After setup, regularly check:

- ✅ Azure Portal → Cosmos DB → **Metrics** (FREE)
  - Monitor Total Request Units
  - Track storage usage
  - Watch for throttling (429 errors)
- ✅ Set up **budget alerts** in Azure Cost Management (FREE)
  - Get notified before unexpected charges
  - Set budget to $5-10/month for development
- ✅ Review **Cost Analysis** monthly (FREE)
  - Identify cost drivers
  - Optimize accordingly

## 🎯 Summary: Maximum Cost Savings Configuration

| Setting               | Recommended Value        | Monthly Cost        |
| --------------------- | ------------------------ | ------------------- |
| **Capacity Mode**     | Serverless               | ~$0-5 (pay per use) |
| **Free Tier**         | Enabled (if available)   | -$24/month credit   |
| **Regions**           | Single region only       | Base cost           |
| **Throughput**        | Shared across containers | Saves ~$72/month    |
| **Networking**        | Public endpoint          | $0                  |
| **Backup**            | Periodic (default)       | $0                  |
| **Encryption**        | Service-managed          | $0                  |
| **Monitoring**        | Built-in metrics only    | $0                  |
| **Private Endpoint**  | Disabled                 | Saves ~$7.30/month  |
| **Continuous Backup** | Disabled                 | Saves ~$5-10/month  |

**Expected Total: $0-5/month** for development workloads with reasonable usage!

---

## Useful Resources

- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [.NET SDK for Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/sql/sql-api-sdk-dotnet-standard)
- [Partitioning Best Practices](https://docs.microsoft.com/azure/cosmos-db/partitioning-overview)
- [Request Units (RU) Explained](https://docs.microsoft.com/azure/cosmos-db/request-units)
- [Pricing Calculator](https://cosmos.azure.com/capacitycalculator/)

---

## Troubleshooting

### Common Issues

**Issue: Connection Timeout**

- Check firewall rules
- Verify network connectivity
- Ensure correct endpoint URL

**Issue: 429 (Too Many Requests)**

- Increase provisioned throughput
- Optimize queries
- Implement retry logic

**Issue: High Costs**

- Review indexing policy
- Check for cross-partition queries
- Monitor unused resources
- Consider autoscale or serverless

---

## Support

For issues or questions:

- Azure Portal: Use "Help + support"
- Documentation: [Azure Cosmos DB Docs](https://docs.microsoft.com/azure/cosmos-db/)
- Community: Stack Overflow (tag: azure-cosmosdb)
