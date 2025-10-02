# Azure Web App Deployment Troubleshooting Guide

## Problem: Application Error after Key Vault Configuration

Your application is failing in Azure after adding Key Vault integration. This is a common issue with several possible causes.

---

## 🔍 Root Cause Analysis

The error occurs because your `Program.cs` tries to connect to Azure Key Vault in Production:

```csharp
if (builder.Environment.IsProduction())
{
    var keyVaultEndpoint = builder.Configuration["KeyVault:Endpoint"];

    if (!string.IsNullOrEmpty(keyVaultEndpoint))
    {
        builder.Configuration.AddAzureKeyVault(
            new Uri(keyVaultEndpoint),
            new DefaultAzureCredential());  // ❌ This is failing!
    }
}
```

**Common causes:**

1. ✅ **Managed Identity NOT enabled** on Azure Web App
2. ✅ **Key Vault access policy NOT configured** for Managed Identity
3. ✅ **Secrets NOT stored** in Azure Key Vault
4. ✅ **Key Vault endpoint NOT configured** in Web App settings
5. ✅ **Network firewall** blocking Key Vault access

---

## 🚀 Quick Fix Solutions

### Option 1: Temporarily Disable Key Vault (Immediate Fix)

This will get your app running immediately while you properly configure Key Vault.

**Steps:**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your **App Service** (`fullstack-app-prod`)
3. Go to **Configuration** → **Application Settings**
4. **REMOVE** the `KeyVault__Endpoint` setting (if it exists)
5. Click **Save** and **Continue**

**Why this works:** If the `KeyVault:Endpoint` configuration is not present, the Key Vault code won't execute, and your app will start normally.

---

### Option 2: Properly Configure Key Vault (Recommended)

Follow these steps to set up Key Vault correctly:

#### Step 1: Enable Managed Identity on Web App

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your **App Service** (`fullstack-app-prod`)
3. In left menu, go to **Identity**
4. Under **System assigned** tab:
   - Toggle **Status** to **On**
   - Click **Save**
   - Click **Yes** to confirm
5. **Copy the Object (principal) ID** that appears (you'll need this)

#### Step 2: Grant Key Vault Access to Managed Identity

1. Go to your **Key Vault** (`keyvault-martin`)
2. In left menu, go to **Access policies** (or **Access control (IAM)** if using RBAC)

**Using Access Policies (Classic):**

3. Click **+ Add Access Policy**
4. **Secret permissions**: Select **Get** and **List**
5. **Select principal**: Paste the Object ID from Step 1, or search for your App Service name
6. Click **Select**, then **Add**
7. Click **Save** (IMPORTANT!)

**Using RBAC (Recommended):**

3. Go to **Access control (IAM)**
4. Click **+ Add** → **Add role assignment**
5. Select role: **Key Vault Secrets User**
6. Click **Next**
7. **Assign access to**: Managed Identity
8. Click **+ Select members**
9. **Managed identity**: App Service
10. Select your app: `fullstack-app-prod`
11. Click **Select**, then **Review + assign**

#### Step 3: Add Secrets to Key Vault

Your application expects these secrets in Key Vault:

1. Go to your **Key Vault** (`keyvault-martin`)
2. In left menu, go to **Secrets**
3. Click **+ Generate/Import** for each secret:

**Secret 1: CosmosDb--Account**

- **Name**: `CosmosDb--Account` (use double dash, NOT colon)
- **Value**: `https://[your-cosmos-account].documents.azure.com:443/`
- Click **Create**

**Secret 2: CosmosDb--Key**

- **Name**: `CosmosDb--Key` (use double dash, NOT colon)
- **Value**: [Your Cosmos DB Primary Key]
- Click **Create**

> ⚠️ **IMPORTANT**: Azure Key Vault secret names use **double dash (`--`)** instead of colon (`:`) for hierarchical configuration keys.

#### Step 4: Configure Key Vault Endpoint in Web App

1. Go back to your **App Service** (`fullstack-app-prod`)
2. Go to **Configuration** → **Application Settings**
3. Click **+ New application setting**
4. **Name**: `KeyVault__Endpoint` (double underscore)
5. **Value**: `https://keyvault-martin.vault.azure.net/`
6. Click **OK**, then **Save**, then **Continue**

#### Step 5: Restart Web App

1. In your App Service, click **Restart** at the top
2. Click **Yes** to confirm
3. Wait 1-2 minutes for the app to restart

---

## 🧪 Verify the Fix

### Test 1: Check Application Logs

1. Go to your **App Service** (`fullstack-app-prod`)
2. In left menu, go to **Log stream**
3. Look for startup logs:
   - ✅ **Success**: No errors about Key Vault or credentials
   - ❌ **Still failing**: Check errors for more details

### Test 2: Test Health Endpoint

1. Open browser to: `https://fullstack-app-prod.azurewebsites.net/api/health`
2. Check response:

```json
{
  "environment": "Production",
  "isProduction": true,
  "isDevelopment": false,
  "databaseName": "MarketplaceDB"
}
```

### Test 3: Check Application Insights (if enabled)

1. Go to **Application Insights** (if configured)
2. Look for exceptions related to:
   - `Azure.Identity`
   - `Key Vault`
   - `Managed Identity`

---

## 🔒 Security Best Practices

### Network Security

**Option A: Allow Azure Services (Easiest)**

1. Go to your **Key Vault**
2. Go to **Networking**
3. **Firewalls and virtual networks**:
   - Select **Allow public access from specific virtual networks and IP addresses**
   - Under **Exception**, check ✅ **Allow trusted Microsoft services to bypass this firewall**
4. Click **Apply**

**Option B: Add Web App Outbound IPs (More Secure)**

1. Go to your **App Service**
2. Go to **Properties**
3. Copy all **Outbound IP addresses**
4. Go to your **Key Vault** → **Networking**
5. Under **Firewall**, add each outbound IP
6. Click **Apply**

---

## 🐛 Common Error Messages and Solutions

### Error: "DefaultAzureCredential failed to retrieve a token"

**Cause**: Managed Identity not enabled or not configured properly.

**Solution**:

1. Verify Managed Identity is **On** in App Service → Identity
2. Check that Object ID exists
3. Restart the Web App

### Error: "The user, group or application does not have secrets get permission"

**Cause**: Key Vault access policy not configured.

**Solution**:

1. Follow Step 2 above to grant access
2. Make sure you clicked **Save** after adding the policy
3. Wait 1-2 minutes for permissions to propagate

### Error: "Secret not found"

**Cause**: Secrets not added to Key Vault or wrong naming format.

**Solution**:

1. Verify secrets exist in Key Vault
2. Check secret names use **double dash** (`CosmosDb--Account`, NOT `CosmosDb:Account`)
3. Secret names are case-sensitive

### Error: "KeyVault endpoint not configured"

**Cause**: Missing or incorrect application setting.

**Solution**:

1. Add `KeyVault__Endpoint` (double underscore) to App Settings
2. Value should be full URL: `https://keyvault-martin.vault.azure.net/`
3. Save and restart Web App

---

## 📊 Verification Checklist

Before your app will work, verify ALL of these:

- [ ] ✅ Managed Identity is **enabled** on Web App
- [ ] ✅ Key Vault access policy/RBAC is **configured** for Managed Identity
- [ ] ✅ Secrets are **stored** in Key Vault with correct names (`CosmosDb--Account`, `CosmosDb--Key`)
- [ ] ✅ `KeyVault__Endpoint` is **configured** in App Service Settings
- [ ] ✅ Key Vault **networking** allows access from Web App
- [ ] ✅ Web App has been **restarted** after configuration changes

---

## 🔄 Alternative: Use App Service Configuration Instead

If you're having trouble with Key Vault, you can store secrets directly in App Service Configuration (less secure but simpler):

### Steps:

1. Go to **App Service** → **Configuration** → **Application Settings**
2. Add these settings:

```
Name: CosmosDb__Account
Value: https://[your-cosmos-account].documents.azure.com:443/

Name: CosmosDb__Key
Value: [Your Cosmos DB Primary Key]
```

3. **REMOVE** the `KeyVault__Endpoint` setting
4. Click **Save** → **Continue**
5. Restart Web App

> ⚠️ **Note**: This is less secure than Key Vault but works immediately. Use for testing only.

---

## 📝 Update Program.cs for Better Error Handling

Consider updating `Program.cs` to handle Key Vault errors gracefully:

```csharp
// Add Azure Key Vault configuration in Production
if (builder.Environment.IsProduction())
{
    var keyVaultEndpoint = builder.Configuration["KeyVault:Endpoint"];

    if (!string.IsNullOrEmpty(keyVaultEndpoint))
    {
        try
        {
            builder.Configuration.AddAzureKeyVault(
                new Uri(keyVaultEndpoint),
                new DefaultAzureCredential());

            Console.WriteLine("✅ Successfully connected to Azure Key Vault");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ Warning: Could not connect to Key Vault: {ex.Message}");
            Console.WriteLine("Continuing with configuration from App Settings...");
            // App continues with App Settings configuration as fallback
        }
    }
}
```

This allows the app to start even if Key Vault connection fails, using App Settings as a fallback.

---

## 🔍 Debugging: Enable Detailed Logging

Add these application settings temporarily to see detailed logs:

```
Name: AZURE_LOG_LEVEL
Value: verbose

Name: Logging__LogLevel__Azure.Identity
Value: Debug

Name: Logging__LogLevel__Azure.Core
Value: Debug
```

After adding these, restart and check **Log Stream** for detailed credential flow information.

---

## 📚 Related Documentation

- [Azure Managed Identity](https://docs.microsoft.com/azure/active-directory/managed-identities-azure-resources/overview)
- [Azure Key Vault Access Policies](https://docs.microsoft.com/azure/key-vault/general/assign-access-policy)
- [DefaultAzureCredential](https://docs.microsoft.com/dotnet/api/azure.identity.defaultazurecredential)
- [App Service Configuration](https://docs.microsoft.com/azure/app-service/configure-common)

---

## 🆘 Still Not Working?

1. **Check Log Stream** in Azure Portal for specific error messages
2. **Enable Application Insights** for detailed telemetry
3. **Test locally** with Azure CLI credentials: `az login`
4. **Compare working vs broken** commits in GitHub
5. **Contact Azure Support** with Log Stream output

---

## Quick Reference: Configuration Key Formats

| Location              | Format                          | Example             |
| --------------------- | ------------------------------- | ------------------- |
| **appsettings.json**  | Colon (`:`)                     | `CosmosDb:Account`  |
| **User Secrets**      | Colon (`:`)                     | `CosmosDb:Account`  |
| **App Settings**      | Double underscore (`__`)        | `CosmosDb__Account` |
| **Key Vault Secrets** | Double dash (`--`)              | `CosmosDb--Account` |
| **Environment Vars**  | Double underscore (`__`) or `:` | `CosmosDb__Account` |

> 💡 **Tip**: ASP.NET Core automatically converts all formats to the same internal representation.

---

**Summary**: Your app is likely failing because Managed Identity isn't configured to access Key Vault. Follow Option 1 for immediate fix, or Option 2 for proper production setup.
