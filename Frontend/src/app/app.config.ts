import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { IMAGE_CONFIG } from '@angular/common';
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
import { msalConfig, loginRequest, protectedResourceMap } from './core/auth/auth-config';

import { CategoriesService } from './core/services/categories.service';
import { firstValueFrom, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { CarouselService } from './core/services/carousel.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes),
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
    provideAppInitializer(() => {
      // MSAL init - let it run in background
      const msalService = inject(MsalService);
      msalService.instance.initialize();

      // Wait for these critical startup services
      const categoriesService = inject(CategoriesService);
      categoriesService.loadCategories();

      const carouselService = inject(CarouselService);
      carouselService.loadActiveSlides();

      return firstValueFrom(
        combineLatest([
          toObservable(categoriesService.loading).pipe(filter((loading) => !loading)),
          toObservable(carouselService.activeSlidesLoading).pipe(filter((loading) => !loading)),
        ]),
      );
    }),
    MsalService,
    MsalBroadcastService,
    MsalGuard,
  ],
};
