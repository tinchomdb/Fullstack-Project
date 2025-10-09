import { LogLevel, Configuration, BrowserCacheLocation } from '@azure/msal-browser';
import { environment } from '../environments/environment';

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
      logLevel: LogLevel.Verbose,
      piiLoggingEnabled: false,
    },
  },
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'email'],
};

// Map API endpoints that require authentication
// MSAL will automatically attach JWT token to requests matching these patterns
export const protectedResourceMap = new Map<string, Array<string>>([
  // Cart checkout and migration require authentication
  [`${environment.apiBase}/api/carts/migrate`, ['openid', 'profile', 'email']],
  [`${environment.apiBase}/api/carts/*/checkout`, ['openid', 'profile', 'email']],
  // All order operations require authentication
  [`${environment.apiBase}/api/orders`, ['openid', 'profile', 'email']],
]);
