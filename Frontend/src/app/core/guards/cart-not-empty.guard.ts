import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { CartService } from '../services/cart.service';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const cartNotEmptyGuard: CanActivateFn = () => {
  const cartService = inject(CartService);

  // Fast-path: if already loaded and not empty, allow immediately
  if (cartService.cartReady() && !cartService.isEmpty()) {
    return true;
  }

  // Wait for auth initialization, then wait for cart to load
  return toObservable(cartService.cartReady).pipe(
    filter((ready) => ready),
    take(1),
    map(() => {
      const hasItems = !cartService.isEmpty();
      return hasItems;
    }),
  );
};
