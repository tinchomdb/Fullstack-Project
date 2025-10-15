import { LogLevel, Configuration, BrowserCacheLocation } from '@azure/msal-browser';
import { environment } from '../../../environments/environment';

const clientId = environment.msalClientId;
const authority = environment.msalAuthority;

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority,
    redirectUri: '/',
    postLogoutRedirectUri: '/',
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
  },
  system: {
    loggerOptions: {
      loggerCallback(logLevel: LogLevel, message: string) {
        console.log(message);
      },
      logLevel: LogLevel.Error,
      piiLoggingEnabled: false,
    },
  },
};

// API scope for accessing the backend API
// This scope will be used to request access tokens with the correct audience
// Exported so it can be used for token refresh to get roles claim
export const apiScope = 'api://c90274e1-2286-4a11-8734-52cee58da3e0/Marketplace.Access';

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', apiScope],
};

// Map API endpoints that require authentication
// MSAL interceptor will automatically attach JWT access tokens to requests matching these patterns
export const protectedResourceMap = new Map<string, Array<string>>([
  [`${environment.apiBase}/api/carts/migrate`, [apiScope]],
  [`${environment.apiBase}/api/carts/*/checkout`, [apiScope]],
  [`${environment.apiBase}/api/orders`, [apiScope]],
  [`${environment.apiBase}/api/admin`, [apiScope]],
]);
