import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalService,
  MsalBroadcastService,
  MsalGuard,
  MsalInterceptor,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { msalConfig, loginRequest, protectedResourceMap } from './auth-config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: () => new PublicClientApplication(msalConfig),
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: () => ({
        interactionType: InteractionType.Redirect,
        authRequest: loginRequest,
        loginFailedRoute: '/products',
      }),
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: (): MsalInterceptorConfiguration => ({
        interactionType: InteractionType.Redirect,
        protectedResourceMap,
      }),
    },
    provideAppInitializer(() => {
      const msalService = inject(MsalService);
      return msalService.instance.initialize();
    }),
    MsalService,
    MsalBroadcastService,
    MsalGuard,
  ],
};
