import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { AuthService } from '../auth/auth.service';
import { filter, map, take, switchMap, delay, skip } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const cartNotEmptyGuard: CanActivateFn = () => {
  const cartService = inject(CartService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const authInitialized$ = toObservable(authService.authInitialized);
  const cartLoading$ = toObservable(cartService.loading);

  // Fast-path: if already loaded and not empty, allow immediately
  if (cartService.cart() !== null && !cartService.isEmpty()) {
    return true;
  }

  // Wait for auth initialization, then wait for cart to load
  return authInitialized$.pipe(
    filter((initialized) => initialized),
    take(1),
    switchMap(() =>
      cartLoading$.pipe(
        delay(0), // Let cart loading effect trigger
        filter((loading) => !loading),
        take(1),
        switchMap(() => {
          // If cart is null, wait for next loading cycle (true -> false)
          if (cartService.cart() === null) {
            return cartLoading$.pipe(
              filter((loading) => loading),
              take(1),
              switchMap(() =>
                cartLoading$.pipe(
                  filter((loading) => !loading),
                  take(1),
                ),
              ),
            );
          }
          return [true];
        }),
      ),
    ),
    map(() => {
      const hasItems = cartService.cart() !== null && !cartService.isEmpty();
      if (!hasItems) {
        router.navigate(['/cart']);
      }
      return hasItems;
    }),
  );
};
