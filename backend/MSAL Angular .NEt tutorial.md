# Angular SPA + ASP.NET Core Web API with Microsoft Entra External ID

## Overview

This guide demonstrates how to configure an Angular single-page application (SPA) with MSAL Angular to authenticate users and call a protected ASP.NET Core web API using Microsoft Entra External ID.

## Architecture

- **Angular SPA**: Signs in users and obtains JWT tokens using MSAL Angular
- **Access Token**: Used as bearer token to authorize API calls
- **ASP.NET Core API**: Protected using Microsoft.Identity.Web for token validation

## Prerequisites

- Visual Studio or Visual Studio Code
- .NET 9.0 SDK
- Node.js and npm
- Microsoft Entra External ID tenant

## Configuration Steps

### 1. Create User Flows (Optional)

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com)
2. Create a sign-up and sign-in user flow
3. Enable password reset if needed
4. Add external identity providers (Google, Facebook) if desired

### 2. Register the Web API

**Create App Registration:**

1. Navigate to [Microsoft Entra admin center](https://entra.microsoft.com)
2. Go to **App Registrations** → **New registration**
3. Set name (e.g., `your-api-name`)
4. Select **Accounts in this organizational directory only**
5. Click **Register**
6. Copy the **Application (client) ID** - you'll need this later

**Expose API:**

1. Go to **Expose an API**
2. Click **Set** next to Application ID URI
3. Accept the default `api://{clientId}` format
4. Click **Save**

**Add Delegated Permissions (Scopes):**

1. Click **Add a scope**
2. Create your scopes (e.g., `YourScope.Read`, `YourScope.ReadWrite`)
   - Scope name: `YourScope.Read`
   - Admin consent display name: Brief description
   - Admin consent description: Detailed description
   - State: **Enabled**
3. Click **Add scope**
4. Repeat for `YourScope.ReadWrite`

**Add Application Permissions (App Roles):**

1. Go to **App roles** → **Create app role**
2. Create app roles (e.g., `YourScope.Read.All`, `YourScope.ReadWrite.All`)
   - Display name: `YourScope.Read.All`
   - Allowed member types: **Application**
   - Value: `YourScope.Read.All`
   - Description: Brief description
3. Click **Apply**

**Configure Optional Claims:**

1. Go to **Token configuration** → **Add optional claim**
2. Select **Access** token type
3. Select **idtyp** claim (helps distinguish app tokens from user tokens)
4. Click **Add**

**Update Manifest:**

1. Go to **Manifest**
2. Set `accessTokenAcceptedVersion` to `2`
3. Click **Save**

**Configure API appsettings.json:**

```json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "YOUR_TENANT_ID",
    "ClientId": "YOUR_API_CLIENT_ID",
    "Audience": "api://YOUR_API_CLIENT_ID"
  }
}
```

### 3. Register the Angular SPA

**Create App Registration:**

1. Go to **App Registrations** → **New registration**
2. Set name (e.g., `your-spa-name`)
3. Select **Accounts in this organizational directory only**
4. Click **Register**
5. Copy the **Application (client) ID**

**Configure Authentication:**

1. Go to **Authentication** → **Add a platform**
2. Select **Single-page application**
3. Add redirect URIs:
   - `http://localhost:4200`
   - `http://localhost:4200/auth`
   - Add your production URLs
4. Click **Save**

**Add API Permissions:**

1. Go to **API permissions** → **Add a permission**

2. **Microsoft Graph** (Microsoft APIs tab):

   - `openid`
   - `offline_access`

3. **Your API** (My APIs tab):

   - Select your API (the one registered in step 2)
   - Select your delegated permissions (e.g., `YourScope.Read`, `YourScope.ReadWrite`)

4. Click **Grant admin consent for {tenant}** (requires admin rights)

**Configure Angular auth-config.ts:**

```typescript
export const msalConfig = {
  auth: {
    clientId: "YOUR_SPA_CLIENT_ID",
    authority: "https://YOUR_TENANT_SUBDOMAIN.ciamlogin.com/",
    redirectUri: "http://localhost:4200",
  },
};

export const protectedResources = {
  api: {
    endpoint: "https://your-api-url",
    scopes: ["api://YOUR_API_CLIENT_ID/YourScope.Read"],
  },
};
```

## Implementation

### ASP.NET Core API Setup

#### 1. Configure CORS

⚠️ **Important**: The example below allows all origins for demonstration only. In production, restrict to specific domains.

```csharp
// Program.cs
public void ConfigureServices(IServiceCollection services)
{
    // For development/testing (INSECURE - allows all origins)
    services.AddCors(o => o.AddPolicy("default", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    }));

    // For production (SECURE - restrict origins)
    services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularApp", policy =>
        {
            policy.WithOrigins("http://localhost:4200", "https://your-production-domain.com")
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });
}
```

💡 **Best Practice**: If hosting on Azure App Service, configure CORS directly in the App Service settings.

#### 2. Add Authentication

```csharp
// Program.cs
public void ConfigureServices(IServiceCollection services)
{
    // Adds Microsoft Identity platform (AAD v2.0) support to protect this API
    services.AddMicrosoftIdentityWebApiAuthentication(Configuration);

    // ... other services
}
```

In the pipeline:

```csharp
app.UseCors("AllowAngularApp"); // or "default" for dev
app.UseAuthentication();
app.UseAuthorization();
```

#### 3. Protect API Endpoints with Scopes and Roles

Use `RequiredScopeOrAppPermission` to accept BOTH delegated permissions (user tokens) and application permissions (app tokens):

```csharp
[HttpGet]
[RequiredScopeOrAppPermission(
    RequiredScopesConfigurationKey = "AzureAD:Scopes:Read",
    RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Read"
)]
public async Task<IActionResult> GetAsync()
{
    var toDos = await _toDoContext.ToDos!
        .Where(td => RequestCanAccessToDo(td.Owner))
        .ToListAsync();

    return Ok(toDos);
}
```

**appsettings.json configuration:**

```json
{
  "AzureAD": {
    "Scopes": {
      "Read": "YourScope.Read",
      "Write": "YourScope.ReadWrite"
    },
    "AppPermissions": {
      "Read": "YourScope.Read.All",
      "Write": "YourScope.ReadWrite.All"
    }
  }
}
```

#### 4. Distinguish Between User and App Tokens

**Why this matters**: User tokens should only access their own data, while app tokens can access all data.

```csharp
private bool IsAppMakingRequest()
{
    // Method 1: Check the 'idtyp' optional claim (most reliable)
    // This is why we added the idtyp claim in token configuration
    if (HttpContext.User.Claims.Any(c => c.Type == "idtyp"))
    {
        return HttpContext.User.Claims.Any(c => c.Type == "idtyp" && c.Value == "app");
    }

    // Method 2: Fallback - app tokens have 'roles' claim but no 'scp' claim
    return HttpContext.User.Claims.Any(c => c.Type == "roles")
        && !HttpContext.User.Claims.Any(c => c.Type == "scp");
}
```

#### 5. Filter Data Based on Caller Type

```csharp
private bool RequestCanAccessToDo(Guid userId)
{
    // If it's an app token, allow access to all data
    // If it's a user token, only allow access to their own data
    return IsAppMakingRequest() || (userId == GetUserId());
}

[HttpGet]
[RequiredScopeOrAppPermission(
    RequiredScopesConfigurationKey = "AzureAD:Scopes:Read",
    RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Read"
)]
public async Task<IActionResult> GetAsync()
{
    // Filter results based on whether this is a user or app request
    var toDos = await _toDoContext.ToDos!
        .Where(td => RequestCanAccessToDo(td.Owner))
        .ToListAsync();

    return Ok(toDos);
}
```

**Key Concepts:**

- **Delegated permissions** (`scp` claim): User is signed in, API acts on behalf of the user
- **Application permissions** (`roles` claim): No user signed in, API acts as itself
- **Data filtering**: User tokens → own data only; App tokens → all data

### Angular SPA Setup

**Install MSAL:**

```bash
npm install @azure/msal-angular @azure/msal-browser
```

**app.config.ts:**

```typescript
import { ApplicationConfig } from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import {
  MsalGuard,
  MsalInterceptor,
  MsalService,
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
} from "@azure/msal-angular";
import {
  msalConfig,
  msalGuardConfig,
  msalInterceptorConfig,
} from "./auth-config";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        /* MSAL interceptor */
      ])
    ),
    {
      provide: MSAL_INSTANCE,
      useFactory: () => new PublicClientApplication(msalConfig),
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useValue: msalGuardConfig,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useValue: msalInterceptorConfig,
    },
    MsalService,
    MsalGuard,
  ],
};
```

## Key Concepts

### Token Validation

- API validates JWT access tokens automatically via `Microsoft.Identity.Web`
- Use [jwt.ms](https://jwt.ms) to decode and debug tokens

### Permission Types

- **Delegated Permissions (Scopes)**: User + app context (claim: `scp`)
- **Application Permissions (Roles)**: App-only context (claim: `roles`)

### Security Best Practices

- Use specific CORS policies (not `AllowAnyOrigin` in production)
- Set `accessTokenAcceptedVersion` to `2` in manifest
- Follow principle of least privilege for permissions
- Filter data based on user identity for delegated permissions
- Configure appropriate redirect URIs for each environment

## Troubleshooting

**Common Issues:**

- **CORS errors**: Check CORS policy allows your Angular app origin
- **401 Unauthorized**: Verify token scopes match required permissions
- **Token validation fails**: Ensure `accessTokenAcceptedVersion: 2` in API manifest
- **Admin consent needed**: Grant admin consent in Azure portal for delegated permissions

**Debugging:**

- Decode tokens at [jwt.ms](https://jwt.ms)
- Check browser console for MSAL errors
- Verify redirect URIs match exactly (including trailing slashes)

## Additional Resources

- [Microsoft.Identity.Web Documentation](https://aka.ms/ms-id-web)
- [MSAL Angular Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular)
- [Microsoft Entra External ID Documentation](https://learn.microsoft.com/entra/external-id/)
