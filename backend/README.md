# Backend API - Marketplace Application

ASP.NET Core 9.0 Web API for the Marketplace application with Azure Cosmos DB and Azure Key Vault integration.

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Azure Production Setup](#azure-production-setup)
- [Configuration Guide](#configuration-guide)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Angular)                                      │
│ http://localhost:4200 (dev)                            │
https://agreeable-pond-0d8f08903.1.azurestaticapps.net/products (prod)
└────────────────┬────────────────────────────────────────┘
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Backend API (.NET 9)                                    │
│ https://localhost:5099 (dev)                           │
│ https://fullstack-app-prod.azurewebsites.net (prod)   │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │                         │
    ▼                         ▼
┌───────────────┐    ┌──────────────────┐
│ Azure Key     │    │ Azure Cosmos DB  │
│ Vault         │    │ (NoSQL)          │
│               │    │                  │
│ Secrets:      │    │ Database:        │
│ - CosmosDb    │    │ MarketplaceDB    │
│   Key         │    │                  │
└───────────────┘    └──────────────────┘
```

---

## 📦 Prerequisites

### Required:

- **.NET 9.0 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/9.0)

---

## 🚀 Local Development Setup

### Step 1: Clone Repository

```powershell
git clone https://github.com/tinchomdb/Fullstack-Project.git
cd "Fullstack-Project\backend\Api"
```

### Step 2: Restore Dependencies

```powershell
dotnet restore
```

### Step 3: Configure User Secrets

User Secrets keep your local development credentials secure and out of source control.

```powershell
# Initialize User Secrets (if not already done)
dotnet user-secrets init

# Set Cosmos DB credentials
dotnet user-secrets set "CosmosDb:Account" "https://[your-cosmos-account].documents.azure.com:443/"
dotnet user-secrets set "CosmosDb:Key" "YOUR_COSMOS_DB_PRIMARY_KEY"

# Verify secrets are set
dotnet user-secrets list
```

**Where to get Cosmos DB credentials:**

- Azure Portal → Your Cosmos DB Account → **Keys** section

📚 **Detailed guide:** See [USER_SECRETS_SETUP.md](USER_SECRETS_SETUP.md)

### Step 4: Run the Application

```powershell
dotnet run
```

The API will be available at:

- **HTTPS:** https://localhost:5099
- **HTTP:** http://localhost:5000

### Step 5: Verify It's Working

Open in browser: https://localhost:5099/api/health

Expected response:

```json
{
  "environment": "Development",
  "isDevelopment": true,
  "isProduction": false,
  "databaseName": "MarketplaceDB"
}
```

---

## ☁️ Azure Production Setup

### Overview

Production uses **Azure Key Vault** with **Managed Identity** for secure credential management.

```
Azure App Service (Managed Identity)
        ↓ authenticates with
Azure Key Vault
        ↓ provides credentials to
Azure Cosmos DB
```

### Quick Setup Checklist

- [ ] Azure Cosmos DB created
- [ ] Azure Key Vault created
- [ ] Secrets added to Key Vault
- [ ] Azure App Service created
- [ ] Managed Identity enabled
- [ ] Key Vault access granted to Managed Identity
- [ ] Environment variables configured

### Detailed Setup Steps

#### 1. Create Azure Resources

**Cosmos DB:**

- See [COSMOS_DB_SETUP.md](COSMOS_DB_SETUP.md) for detailed setup

**Key Vault:**

- Name: `keyvault-martin` (or your choice)
- Region: Same as your App Service

**App Service:**

- Name: `fullstack-app-prod` (or your choice)
- Runtime: .NET 9
- Region: Same as Cosmos DB for best performance

#### 2. Enable Managed Identity

```powershell
# Via Azure Portal:
App Service → Identity → System assigned → Status: ON → Save

# Or via Azure CLI:
az webapp identity assign --name fullstack-app-prod --resource-group [your-rg]
```

Copy the **Object (principal) ID** - you'll need it next.

#### 3. Add Secrets to Key Vault

Azure Portal → Key Vault → Secrets → Generate/Import

**Secret 1:**

```
Name: CosmosDb--Key
Value: [Your Cosmos DB Primary Key]
```

⚠️ **Note:** Use double dash (`--`) in secret names, not colon!

#### 4. Grant Key Vault Access

**Option A: RBAC (Recommended)**

```powershell
az role assignment create \
  --role "Key Vault Secrets User" \
  --assignee [managed-identity-object-id] \
  --scope /subscriptions/[sub-id]/resourceGroups/[rg]/providers/Microsoft.KeyVault/vaults/keyvault-martin
```

**Option B: Access Policy**

```
Key Vault → Access policies → Add Access Policy
- Secret permissions: Get, List
- Select principal: [Your App Service Managed Identity]
- Save
```

#### 5. Configure App Service Environment Variables

```
App Service → Settings → Environment variables → App settings

Add:
Name: CosmosDb__Account
Value: https://[your-cosmos-account].documents.azure.com:443/

(Key comes from Key Vault automatically)
```

#### 6. Deploy Application

Deployment happens automatically via GitHub Actions when you push to `main` branch.

Manual deployment:

```powershell
# Publish locally
dotnet publish -c Release -o ./publish

# Deploy to Azure (requires Azure CLI login)
az webapp deploy --name fullstack-app-prod --resource-group [your-rg] --src-path ./publish.zip
```

#### 7. Verify Production

Open: https://fullstack-app-prod.azurewebsites.net/api/health

Check logs:

```
App Service → Log stream

Look for: ✅ Successfully connected to Azure Key Vault
```

📚 **Troubleshooting:** See [AZURE_DEPLOYMENT_TROUBLESHOOTING.md](AZURE_DEPLOYMENT_TROUBLESHOOTING.md)

---

## ⚙️ Configuration Guide

### Configuration Files

```
backend/Api/
├── appsettings.json                    # Base config (all environments)
├── appsettings.Development.json        # Development overrides
└── appsettings.Production.json         # Production overrides
```

### Configuration Sources (Priority Order)

Configuration is loaded in this order (later sources override earlier ones):

1. **appsettings.json** - Base configuration
2. **appsettings.{Environment}.json** - Environment-specific overrides
3. **User Secrets** - Local development only (via `dotnet user-secrets`)
4. **Environment Variables** - Azure App Service settings
5. **Azure Key Vault** - Production secrets (via Managed Identity)
6. **Command-line arguments** - Runtime overrides

### Configuration by Environment

| Setting               | Development      | Production                  |
| --------------------- | ---------------- | --------------------------- |
| **CosmosDb:Account**  | User Secrets     | Environment Variable        |
| **CosmosDb:Key**      | User Secrets     | Key Vault Secret            |
| **KeyVault:Endpoint** | N/A              | appsettings.Production.json |
| **DatabaseName**      | appsettings.json | appsettings.json            |
| **Logging Level**     | Debug            | Warning                     |

### Key Configuration Settings

#### Cosmos DB Settings

```json
{
  "CosmosDb": {
    "Account": "https://[account].documents.azure.com:443/",
    "Key": "STORED_IN_SECRETS",
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

#### Key Vault Settings (Production Only)

```json
{
  "KeyVault": {
    "Endpoint": "https://keyvault-martin.vault.azure.net/"
  }
}
```

#### CORS Settings

```json
{
  "AllowedOrigins": "http://localhost:4200,https://your-frontend-url.com"
}
```

📚 **Detailed configuration guide:** See [CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)

---

## 🔌 API Endpoints

### Health Check

```http
GET /api/health
```

Returns environment and configuration status.

### Products

```http
GET    /api/products              # Get all products
GET    /api/products/{id}         # Get product by ID
POST   /api/products              # Create product
PUT    /api/products/{id}         # Update product
DELETE /api/products/{id}         # Delete product
```

### Categories

```http
GET    /api/categories            # Get all categories
GET    /api/categories/{id}       # Get category by ID
POST   /api/categories            # Create category
PUT    /api/categories/{id}       # Update category
DELETE /api/categories/{id}       # Delete category
```

### Carts

```http
GET    /api/carts/{userId}        # Get user's cart
POST   /api/carts/{userId}/items  # Add item to cart
PUT    /api/carts/{userId}/items/{productId}  # Update cart item
DELETE /api/carts/{userId}/items/{productId}  # Remove cart item
DELETE /api/carts/{userId}        # Clear cart
```

### Orders

```http
GET    /api/orders                # Get all orders
GET    /api/orders/{id}           # Get order by ID
GET    /api/orders/user/{userId}  # Get user's orders
POST   /api/orders                # Create order
PUT    /api/orders/{id}/status    # Update order status
```

### Swagger Documentation

Available in Development mode only:

- **Swagger UI:** https://localhost:5099/swagger
- **OpenAPI JSON:** https://localhost:5099/swagger/v1/swagger.json

---

## 🚢 Deployment

### Automated Deployment (GitHub Actions)

Deployment happens automatically when you push to the `main` branch and changes are detected in the `backend/` folder.

**Workflow file:** `.github/workflows/main_fullstack-app-prod.yml`

**Deployment process:**

1. Code pushed to `main` branch
2. GitHub Actions triggers
3. Build .NET application
4. Run tests (if configured)
5. Publish artifacts
6. Deploy to Azure App Service using OIDC authentication

**Monitor deployment:**

- GitHub → Actions tab
- Azure Portal → App Service → Deployment Center

### Manual Deployment

```powershell
# Build and publish
cd backend/Api
dotnet publish -c Release -o ./publish

# Deploy using Azure CLI
az webapp deploy \
  --name fullstack-app-prod \
  --resource-group [your-resource-group] \
  --src-path ./publish.zip
```

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: "Application Error" in Azure

**Symptoms:** App shows error page in production

**Solution:**

1. Check logs: App Service → Log stream
2. Verify Managed Identity is enabled
3. Verify Key Vault access is granted
4. Check environment variables are set

📚 See [AZURE_DEPLOYMENT_TROUBLESHOOTING.md](AZURE_DEPLOYMENT_TROUBLESHOOTING.md)

---

#### Issue: "Connection timeout" to Cosmos DB

**Symptoms:** Requests timeout or fail

**Solution:**

1. Check Cosmos DB firewall settings
2. Verify credentials are correct
3. Check Cosmos DB region matches App Service region
4. Review Cosmos DB networking: Allow Azure services

---

#### Issue: "Could not connect to Key Vault"

**Symptoms:** Warning in logs about Key Vault connection

**Possible causes:**

- Managed Identity not enabled
- Key Vault access not granted
- Key Vault endpoint incorrect
- Secrets not added to Key Vault

**Solution:** See [QUICK_FIX.md](QUICK_FIX.md)

---

#### Issue: User Secrets not loading locally

**Symptoms:** `CosmosDb:Account` or `CosmosDb:Key` is null in Development

**Solution:**

```powershell
# Verify environment
$env:ASPNETCORE_ENVIRONMENT
# Should be: Development

# List secrets
dotnet user-secrets list

# If empty, set them:
dotnet user-secrets set "CosmosDb:Account" "YOUR_ACCOUNT_URL"
dotnet user-secrets set "CosmosDb:Key" "YOUR_KEY"
```

---

#### Issue: CORS errors from frontend

**Symptoms:** Browser console shows CORS policy errors

**Solution:**

1. Add frontend URL to `AllowedOrigins` in configuration
2. Development: Already allows `http://localhost:4200`
3. Production: Set environment variable:
   ```
   Name: AllowedOrigins
   Value: https://your-frontend-url.com
   ```

---

### Debug Logging

Enable detailed logging for troubleshooting:

**appsettings.Development.json:**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Azure.Identity": "Debug",
      "Azure.Core": "Debug"
    }
  }
}
```

**Azure App Service:**

```
Environment Variables:
Name: Logging__LogLevel__Azure.Identity
Value: Debug
```

---

## 📚 Additional Documentation

- **[CONFIGURATION_GUIDE.md](CONFIGURATION_GUIDE.md)** - Detailed configuration explanation
- **[COSMOS_DB_SETUP.md](COSMOS_DB_SETUP.md)** - Step-by-step Azure Cosmos DB setup
- **[USER_SECRETS_SETUP.md](USER_SECRETS_SETUP.md)** - Local development secrets setup
- **[AZURE_DEPLOYMENT_TROUBLESHOOTING.md](AZURE_DEPLOYMENT_TROUBLESHOOTING.md)** - Production deployment troubleshooting
- **[QUICK_FIX.md](QUICK_FIX.md)** - Fast solutions for common issues

---

## 🔐 Security Best Practices

### ✅ DO:

- Use **User Secrets** for local development
- Use **Azure Key Vault** for production secrets
- Enable **Managed Identity** on App Service
- Use **HTTPS** for all communications
- Keep dependencies **up to date**
- Rotate **Cosmos DB keys** periodically
- Use **least privilege** access in Key Vault
- Enable **Application Insights** for monitoring

### ❌ DON'T:

- Commit secrets to source control
- Use production keys in development
- Disable CORS without understanding implications
- Share User Secrets files
- Use `any` type excessively in code
- Expose detailed error messages in production

---

## 🏗️ Project Structure

```
backend/
├── Api/
│   ├── Configuration/
│   │   ├── CosmosDbSettings.cs          # Cosmos DB configuration model
│   │   └── ContainerNames.cs            # Container name constants
│   ├── Controllers/
│   │   ├── HealthController.cs          # Health check endpoint
│   │   ├── ProductsController.cs        # Products API
│   │   ├── CategoriesController.cs      # Categories API
│   │   ├── CartsController.cs           # Shopping cart API
│   │   └── OrdersController.cs          # Orders API
│   ├── Models/
│   │   ├── Product.cs                   # Product entity
│   │   ├── Category.cs                  # Category entity
│   │   ├── Cart.cs                      # Cart entity
│   │   ├── CartItem.cs                  # Cart item entity
│   │   ├── Order.cs                     # Order entity
│   │   ├── OrderItem.cs                 # Order item entity
│   │   ├── OrderStatus.cs               # Order status enum
│   │   └── Seller.cs                    # Seller entity
│   ├── Repositories/
│   │   ├── IMarketplaceRepository.cs    # Repository interface
│   │   └── InMemoryMarketplaceRepository.cs  # In-memory implementation
│   ├── appsettings.json                 # Base configuration
│   ├── appsettings.Development.json     # Dev configuration
│   ├── appsettings.Production.json      # Prod configuration
│   ├── Program.cs                       # Application entry point
│   └── Api.csproj                       # Project file
├── Backend.sln                          # Solution file
├── README.md                            # This file
├── CONFIGURATION_GUIDE.md               # Configuration details
├── COSMOS_DB_SETUP.md                   # Azure setup guide
├── USER_SECRETS_SETUP.md                # Local dev setup
├── AZURE_DEPLOYMENT_TROUBLESHOOTING.md  # Troubleshooting guide
└── QUICK_FIX.md                         # Quick solutions

```

---

## 🧪 Testing

### Run Tests

```powershell
dotnet test
```

### Test Endpoints Manually

**Using curl:**

```powershell
# Health check
curl https://localhost:5099/api/health

# Get products
curl https://localhost:5099/api/products

# Create product
curl -X POST https://localhost:5099/api/products `
  -H "Content-Type: application/json" `
  -d '{\"name\":\"Test Product\",\"price\":99.99}'
```

**Using API client:**

- Import `Api.http` file into your HTTP client
- Use Swagger UI in development mode

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

---

## 📝 Environment Variables Reference

### Required for Production

| Variable                 | Source                              | Example                                       | Description                         |
| ------------------------ | ----------------------------------- | --------------------------------------------- | ----------------------------------- |
| `ASPNETCORE_ENVIRONMENT` | App Service                         | `Production`                                  | Environment name                    |
| `CosmosDb__Account`      | Environment Variable                | `https://cosmos-xyz.documents.azure.com:443/` | Cosmos DB endpoint (safe to expose) |
| `KeyVault__Endpoint`     | Environment Variable or config file | `https://keyvault-martin.vault.azure.net/`    | Key Vault URL                       |

### Stored in Key Vault

| Secret Name     | Description                                    |
| --------------- | ---------------------------------------------- |
| `CosmosDb--Key` | Cosmos DB primary or secondary key (sensitive) |

### Optional

| Variable                     | Default                 | Description                            |
| ---------------------------- | ----------------------- | -------------------------------------- |
| `AllowedOrigins`             | `http://localhost:4200` | CORS allowed origins (comma-separated) |
| `Logging__LogLevel__Default` | `Warning`               | Logging level                          |

---

## 🔗 Useful Links

- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Azure Key Vault Documentation](https://docs.microsoft.com/azure/key-vault/)
- [Managed Identity Documentation](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

---

## 📄 License

[Your License Here]

---

## 👥 Authors

- **Martin** - Initial work - [tinchomdb](https://github.com/tinchomdb)

---

## 🎯 Quick Start Summary

### For New Developers:

1. **Clone repo** and navigate to `backend/Api`
2. **Install .NET 9.0 SDK**
3. **Set User Secrets** (see [Local Development Setup](#local-development-setup))
4. **Run:** `dotnet run`
5. **Test:** Open https://localhost:5099/api/health

### For Deployment:

1. **Push to main branch** → Automatic deployment via GitHub Actions
2. **Monitor:** GitHub Actions tab
3. **Verify:** Check Azure App Service logs
4. **Test:** Open production health endpoint

---

**Last Updated:** October 2, 2025
