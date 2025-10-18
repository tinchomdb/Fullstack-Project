import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { CartService } from '../services/cart.service';

export const cartNotEmptyGuard: CanActivateFn = (): boolean => {
  const cartService = inject(CartService);
  return !cartService.isEmpty();
};
