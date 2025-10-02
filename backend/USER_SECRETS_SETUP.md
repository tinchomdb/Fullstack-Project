# Local Development Setup with User Secrets

This guide explains how to configure your Cosmos DB credentials for local development using .NET User Secrets.

## Why User Secrets?

- ✅ Keeps sensitive data out of source control
- ✅ Automatically loaded in Development environment
- ✅ Simple and secure for local development
- ✅ Each developer can have their own credentials

---

## Setup Steps

### 1. Navigate to Your API Project

```powershell
cd "c:\Proyectos\Fullstack Project\backend\Api"
```

### 2. Initialize User Secrets (if not already done)

```powershell
dotnet user-secrets init
```

This adds a `UserSecretsId` to your `Api.csproj` file.

### 3. Set Your Cosmos DB Credentials

Replace the placeholder values with your actual Cosmos DB credentials:

```powershell
# Set Cosmos DB Account (Endpoint)
dotnet user-secrets set "CosmosDb:Account" "https://[your-account-name].documents.azure.com:443/"

# Set Cosmos DB Key
dotnet user-secrets set "CosmosDb:Key" "YOUR_PRIMARY_KEY_HERE"
```

### 4. Verify Secrets Are Set

```powershell
dotnet user-secrets list
```

Expected output:

```
CosmosDb:Account = https://your-account.documents.azure.com:443/
CosmosDb:Key = your-actual-key-here
```

---

## Where Are User Secrets Stored?

User Secrets are stored **outside your project folder** at:

```
%APPDATA%\Microsoft\UserSecrets\[user-secrets-id]\secrets.json
```

**Example path:**

```
C:\Users\YourUsername\AppData\Roaming\Microsoft\UserSecrets\abc123def456\secrets.json
```

This ensures they're **never committed to Git**.

---

## Testing Your Configuration

### 1. Run Your Application

```powershell
dotnet run
```

### 2. Test the Health Endpoint

Open your browser or use curl:

```
GET https://localhost:5001/api/health
```

**Expected Response (Development):**

```json
{
  "environment": "Development",
  "isProduction": false,
  "isDevelopment": true,
  "hasCosmosAccount": true,
  "hasCosmosKey": true,
  "databaseName": "MarketplaceDB",
  "configurationStatus": "Fully Configured"
}
```

If `hasCosmosAccount` or `hasCosmosKey` is `false`, check that you've set the secrets correctly.

---

## Configuration Loading Order

ASP.NET Core loads configuration in this order (later overrides earlier):

1. ✅ `appsettings.json` - Database/container names
2. ✅ `appsettings.Development.json` - Dev-specific settings
3. ✅ **User Secrets** - Your Cosmos DB credentials (Development only)
4. Environment Variables
5. Command-line arguments

---

## Troubleshooting

### Issue: Secrets not loading

**Solution:**

1. Verify you're in the correct directory
2. Check that `ASPNETCORE_ENVIRONMENT` is set to `Development` in `launchSettings.json`
3. Run `dotnet user-secrets list` to verify secrets are set
4. Restart your application

### Issue: "User secrets not found"

**Solution:**

1. Run `dotnet user-secrets init` to initialize
2. Set your secrets again using the commands above

### Issue: Want to remove a secret

```powershell
dotnet user-secrets remove "CosmosDb:Account"
```

### Issue: Want to clear all secrets

```powershell
dotnet user-secrets clear
```

---

## Security Best Practices

✅ **DO:**

- Use User Secrets for local development
- Keep secrets out of source control
- Rotate your Cosmos DB keys periodically
- Use different Cosmos DB accounts for dev/prod

❌ **DON'T:**

- Commit `appsettings.Development.json` if it contains secrets
- Share your User Secrets file directly
- Use production keys for local development

---

## Next Steps for Production

For production deployment:

1. ✅ Set up Azure Key Vault (already configured in your code)
2. ✅ Enable Managed Identity on Azure App Service
3. ✅ Grant Key Vault access to Managed Identity
4. ✅ Set `KeyVault:Endpoint` in Azure App Service configuration

See `COSMOS_DB_SETUP.md` for detailed Azure Key Vault setup instructions.

---

## Summary

Your application is now configured to:

- 🏠 **Local Development**: Use User Secrets
- ☁️ **Production (Azure)**: Use Azure Key Vault with Managed Identity

This provides security in both environments while keeping development simple!
