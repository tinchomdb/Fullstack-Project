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
      loggerCallback: (logLevel: LogLevel, message: string) => console.log(message),
      logLevel: LogLevel.Error,
      piiLoggingEnabled: false,
    },
  },
};

export const apiScope = 'api://c90274e1-2286-4a11-8734-52cee58da3e0/Marketplace.Access';

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', apiScope],
};

export const protectedResourceMap = new Map<string, Array<string>>([
  [`${environment.apiBase}/api/carts/my-cart*`, [apiScope]],
  [`${environment.apiBase}/api/carts/migrate`, [apiScope]],
  [`${environment.apiBase}/api/carts/*/checkout`, [apiScope]],
  [`${environment.apiBase}/api/carts/*/validate-checkout`, [apiScope]],
  [`${environment.apiBase}/api/payments/create-intent`, [apiScope]],
  [`${environment.apiBase}/api/testpayment/test/complete-payment`, [apiScope]],
  [`${environment.apiBase}/api/orders`, [apiScope]],
  [`${environment.apiBase}/api/admin`, [apiScope]],
]);
