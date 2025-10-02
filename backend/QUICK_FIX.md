# 🚨 QUICK FIX: Azure Web App Not Working

## The Fastest Solution (2 minutes)

Your app is failing because it's trying to connect to Azure Key Vault, but the connection isn't properly configured.

### Option A: Disable Key Vault Temporarily (FASTEST)

1. Go to [Azure Portal](https://portal.azure.com) → Your App Service (`fullstack-app-prod`)
2. Click **Configuration** (left menu)
3. Look for `KeyVault__Endpoint` setting
4. If it exists: Click **Edit** (pencil icon) → Click **Delete** → Confirm
5. Click **Save** → **Continue**
6. Click **Restart** at the top of the page

✅ **Your app should work now!**

---

### Option B: Store Secrets in App Settings (Quick & Simple)

1. Go to [Azure Portal](https://portal.azure.com) → Your App Service (`fullstack-app-prod`)
2. Click **Configuration** → **Application settings**
3. **REMOVE** `KeyVault__Endpoint` if it exists
4. Click **+ New application setting** and add:

```
Name: CosmosDb__Account
Value: https://[your-cosmos-account-name].documents.azure.com:443/
```

5. Click **+ New application setting** again:

```
Name: CosmosDb__Key
Value: [paste your Cosmos DB primary key here]
```

6. Click **Save** → **Continue**
7. Click **Restart**

✅ **Your app should work now!**

---

## Where to Get Cosmos DB Credentials

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for your **Cosmos DB account**
3. Click **Keys** in left menu
4. Copy:
   - **URI** → Use for `CosmosDb__Account`
   - **PRIMARY KEY** → Use for `CosmosDb__Key`

---

## Verify It's Working

Open: `https://fullstack-app-prod.azurewebsites.net/api/health`

You should see:
```json
{
  "environment": "Production",
  "isProduction": true
}
```

---

## For Proper Production Setup (Later)

See the detailed guide: **`AZURE_DEPLOYMENT_TROUBLESHOOTING.md`**

This includes:
- ✅ Setting up Managed Identity
- ✅ Configuring Key Vault access
- ✅ Proper security configuration
- ✅ Best practices

---

## What Changed?

Your recent commit added Key Vault integration to `Program.cs`:

```csharp
builder.Configuration.AddAzureKeyVault(
    new Uri(keyVaultEndpoint),
    new DefaultAzureCredential());  // ← This fails without proper setup
```

The code is now updated to handle failures gracefully, but you still need to either:
1. Remove Key Vault configuration (Option A above), OR
2. Store secrets in App Settings (Option B above), OR
3. Properly configure Key Vault (see `AZURE_DEPLOYMENT_TROUBLESHOOTING.md`)

---

**TL;DR**: Go to Azure Portal → App Service → Configuration → Delete `KeyVault__Endpoint` setting → Save → Restart
