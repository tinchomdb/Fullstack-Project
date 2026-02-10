import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { IMAGE_CONFIG } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  withInterceptors,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

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
import { msalConfig, loginRequest, protectedResourceMap } from './core/auth/auth-config';
import { guestAuthInterceptor } from './core/auth/guest-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([guestAuthInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    {
      provide: IMAGE_CONFIG,
      useValue: {
        breakpoints: [
          16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840,
        ],
      },
    },
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
    provideAppInitializer(async () => {
      const msalService = inject(MsalService);
      await msalService.instance.initialize();
    }),
    MsalService,
    MsalBroadcastService,
    MsalGuard,
  ],
};
