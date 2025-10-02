# Configuration Files Explained

This guide explains how the configuration files work together in your ASP.NET Core application.

---

## 📁 Configuration File Structure

```
backend/Api/
├── appsettings.json                    ← Base configuration (ALL environments)
├── appsettings.Development.json        ← Development overrides
└── appsettings.Production.json         ← Production overrides
```

---

## 🔄 How Configuration Loading Works

ASP.NET Core loads configuration files in this **specific order**, where **later sources override earlier ones**:

```
1. appsettings.json                     (BASE - always loaded first)
2. appsettings.{Environment}.json       (OVERRIDES base settings)
3. User Secrets                         (Development only - OVERRIDES both)
4. Environment Variables                (OVERRIDES all above)
5. Azure Key Vault                      (Production only - OVERRIDES all above)
6. Command-line arguments               (OVERRIDES everything)
```

### Example of Override Behavior

If you have:

**appsettings.json:**

```json
{
  "CosmosDb": {
    "DatabaseName": "MarketplaceDB"
  }
}
```

**appsettings.Development.json:**

```json
{
  "CosmosDb": {
    "DatabaseName": "MarketplaceDB-Dev" // This OVERRIDES the base
  }
}
```

In **Development**, you'll get: `DatabaseName = "MarketplaceDB-Dev"`
In **Production**, you'll get: `DatabaseName = "MarketplaceDB"`

---

## 📄 Your Configuration Files Explained

### `appsettings.json` - Base Configuration

**Purpose:** Settings that are **identical across all environments**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "CosmosDb": {
    "DatabaseName": "MarketplaceDB",
    "ContainersNames": {
      "Users": "Users",
      "Products": "Products",
      "Carts": "Carts",
      "Orders": "Orders",
      "Categories": "Categories"
    }
  }
}
```

**What's here:**

- ✅ Database and container names (same in dev and prod)
- ✅ General logging defaults
- ✅ Basic application settings

**What's NOT here:**

- ❌ Secrets (Account, Key) - These come from User Secrets or Key Vault
- ❌ Environment-specific URLs
- ❌ Environment-specific logging levels

---

### `appsettings.Development.json` - Development Overrides

**Purpose:** Settings that **differ** in local development

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  },
  "CosmosDb": {
    "DatabaseName": "MarketplaceDB",
    "ContainersNames": {
      "Users": "Users",
      "Products": "Products",
      "Carts": "Carts",
      "Orders": "Orders",
      "Categories": "Categories"
    }
  }
}
```

**What's here:**

- ✅ More verbose logging for debugging
- ✅ CosmosDb structure (for clarity, though it inherits from base)
- ✅ Development-specific URLs (if different from production)

**What's NOT here:**

- ❌ Secrets (Account, Key) - Use User Secrets instead

**Why include CosmosDb section?**

- Makes it explicit and easy to change if dev needs different container names
- Self-documenting - developers can see the structure at a glance
- Can easily override specific container names for testing

---

### `appsettings.Production.json` - Production Overrides

**Purpose:** Settings specific to **production environment**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "KeyVault": {
    "Endpoint": "https://[your-keyvault-name].vault.azure.net/"
  },
  "CosmosDb": {
    "DatabaseName": "MarketplaceDB",
    "ContainersNames": {
      "Users": "Users",
      "Products": "Products",
      "Carts": "Carts",
      "Orders": "Orders",
      "Categories": "Categories"
    }
  }
}
```

**What's here:**

- ✅ Less verbose logging (Warning level)
- ✅ Azure Key Vault endpoint
- ✅ CosmosDb structure (explicit for production deployments)
- ✅ Production-specific URLs or feature flags

**What's NOT here:**

- ❌ Actual secrets - They come from Azure Key Vault

---

## 🔐 Where Secrets Come From

### Local Development

```
Secrets Source: User Secrets
Location: %APPDATA%\Microsoft\UserSecrets\[guid]\secrets.json

Example secrets.json:
{
  "CosmosDb:Account": "https://your-dev-account.documents.azure.com:443/",
  "CosmosDb:Key": "your-development-key-here"
}
```

### Production (Azure)

```
Secrets Source: Azure Key Vault
Accessed via: Managed Identity
Secrets stored as:
  - CosmosDb--Account (note: double dash, not colon)
  - CosmosDb--Key
```

---

## 🎯 Best Practices

### ✅ DO:

1. **Put shared settings in `appsettings.json`**

   - Database names
   - Container names
   - Feature flags
   - Default values

2. **Put environment-specific settings in environment files**

   - Logging levels
   - Key Vault endpoints
   - Environment-specific URLs

3. **Include CosmosDb structure in all environment files**

   - Makes it easy to override per environment
   - Self-documenting
   - Prevents configuration errors

4. **Store secrets separately**
   - User Secrets for development
   - Azure Key Vault for production
   - Never in appsettings files

### ❌ DON'T:

1. **Don't put secrets in any appsettings file**

   - No connection strings
   - No API keys
   - No passwords

2. **Don't repeat settings unnecessarily**

   - Only override what's different
   - Let inheritance work for you

3. **Don't commit sensitive data**
   - Add `appsettings.*.json` to `.gitignore` if they contain secrets
   - Use User Secrets for local dev

---

## 🧪 Testing Your Configuration

### Test Development Configuration

```powershell
# Set environment to Development (usually automatic in VS/VS Code)
$env:ASPNETCORE_ENVIRONMENT = "Development"

# Run application
dotnet run

# Test health endpoint
curl https://localhost:5001/api/health
```

**Expected output:**

```json
{
  "environment": "Development",
  "isDevelopment": true,
  "isProduction": false,
  "databaseName": "MarketplaceDB"
}
```

### Test Production Configuration (Locally)

```powershell
# Set environment to Production
$env:ASPNETCORE_ENVIRONMENT = "Production"

# Run application
dotnet run

# Test health endpoint
curl https://localhost:5001/api/health
```

**Note:** In production mode locally, it will try to connect to Key Vault (which will fail without proper setup).

---

## 📊 Configuration Comparison Table

| Setting             | appsettings.json | Development     | Production      |
| ------------------- | ---------------- | --------------- | --------------- |
| **Database Name**   | MarketplaceDB    | ✅ Inherits     | ✅ Inherits     |
| **Container Names** | Defined          | ✅ Can override | ✅ Can override |
| **Logging Level**   | Information      | Debug           | Warning         |
| **Key Vault**       | ❌ Not needed    | ❌ Not used     | ✅ Required     |
| **Secrets Source**  | ❌ None          | User Secrets    | Key Vault       |

---

## 🔍 Troubleshooting

### Issue: "Configuration section not found"

**Solution:** Ensure the setting exists in `appsettings.json` (base) or the environment-specific file.

### Issue: "Settings not applying in Development"

**Solution:**

1. Verify `ASPNETCORE_ENVIRONMENT` is set to `Development`
2. Check `launchSettings.json` has correct environment variable
3. Restart application

### Issue: "Different settings than expected"

**Solution:** Remember the override order:

```
appsettings.json < appsettings.{Env}.json < User Secrets < Key Vault
```

### Issue: "Want to use different database for dev"

**Solution:** Override in `appsettings.Development.json`:

```json
{
  "CosmosDb": {
    "DatabaseName": "MarketplaceDB-Dev"
  }
}
```

---

## 🎓 Key Takeaways

1. **Configuration files MERGE**, they don't replace
2. **Later sources override earlier ones**
3. **Shared settings → base file**
4. **Environment-specific settings → environment files**
5. **Secrets → User Secrets or Key Vault (NEVER in appsettings)**
6. **It's OK to repeat structure** for clarity and easy overriding

---

## 📚 Related Documentation

- `USER_SECRETS_SETUP.md` - How to set up User Secrets for local development
- `COSMOS_DB_SETUP.md` - How to set up Azure Key Vault for production
- [ASP.NET Core Configuration](https://docs.microsoft.com/aspnet/core/fundamentals/configuration/)
