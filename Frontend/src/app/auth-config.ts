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

export const protectedResourceMap = new Map<string, Array<string>>([
  [`${environment.apiBase}/api/carts/migrate`, ['openid', 'profile', 'email']],
  [`${environment.apiBase}/api/orders`, ['openid', 'profile', 'email']],
]);
