import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CartService } from '../services/cart.service';
import { AuthService } from '../auth/auth.service';
import { filter, map, take, switchMap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export const cartNotEmptyGuard: CanActivateFn = () => {
  const cartService = inject(CartService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();
  const hasLoadedCart = cartService.cart() !== null;

  // Optimization: synchronous check for guests with loaded cart
  if (!isLoggedIn && hasLoadedCart) {
    return !cartService.isEmpty();
  }

  // For guests without loaded cart or authenticated users, wait for proper state
  const isLoggedInObs = toObservable(authService.isLoggedIn);
  const cartObs = toObservable(cartService.cart);

  return isLoggedInObs.pipe(
    filter(() => {
      const loggedIn = authService.isLoggedIn();
      if (loggedIn) return true;
      return cartService.cart() !== null;
    }),
    switchMap(() => cartObs.pipe(filter((cart) => cart !== null || !cartService.loading()))),
    map(() => (!cartService.isEmpty() ? true : router.parseUrl('/products'))),
    take(1),
  );
};
