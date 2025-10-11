import { inject, Injectable, computed, effect, untracked } from '@angular/core';
import { map, Observable } from 'rxjs';

import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Resource } from '../../shared/utils/resource';
import { Product } from '../models/product.model';
import { CartItem } from '../models/cart-item.model';
import { AuthService } from '../auth/auth.service';
import { LoadingOverlayService } from './loading-overlay.service';
import { CartApiService } from './cart-api.service';
import { CartHelperService } from './cart-helper.service';

export type { CheckoutRequest } from './cart-api.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly authService = inject(AuthService);
  private readonly loadingOverlayService = inject(LoadingOverlayService);
  private readonly cartApi = inject(CartApiService);
  private readonly cartHelper = inject(CartHelperService);
  private readonly cartResource = new Resource<Cart | null>(
    null,
    'Loading cart...',
    this.loadingOverlayService,
  );

  readonly cart = this.cartResource.data;
  readonly loading = this.cartResource.loading;
  readonly error = this.cartResource.error;

  readonly itemCount = computed(
    () => this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
  );

  readonly totalAmount = computed(() => this.cart()?.total ?? 0);
  readonly isEmpty = computed(() => this.itemCount() === 0);

  constructor() {
    this.setupAuthEffect();
    this.subscribeToLoginEvents();
  }

  loadCart(): void {
    const userId = this.getUserId();
    this.cartResource.load(this.cartApi.getActiveCartByUser(userId));
  }

  reloadCart(): void {
    this.loadCart();
  }

  addToCart(product: Product, quantity: number = 1): void {
    const currentCart = this.cart();

    if (!currentCart) {
      const newCart = this.cartHelper.createNewCart(this.getUserId(), product, quantity);
      this.saveCart(newCart);
      return;
    }

    const updatedItems = this.cartHelper.addItemToCart(currentCart.items, product, quantity);
    this.updateCart(currentCart, updatedItems);
  }

  removeFromCart(productId: string): void {
    const currentCart = this.cart();
    if (!currentCart) return;

    const updatedItems = this.cartHelper.removeItemFromCart(currentCart.items, productId);

    if (updatedItems.length === 0) {
      this.clearCart();
      return;
    }

    this.updateCart(currentCart, updatedItems);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const currentCart = this.cart();
    if (!currentCart) return;

    const updatedItems = this.cartHelper.updateItemQuantityInCart(
      currentCart.items,
      productId,
      quantity,
    );

    this.updateCart(currentCart, updatedItems);
  }

  clearCart(): void {
    this.cartResource.load(this.cartApi.deleteCart(this.getUserId()).pipe(map(() => null)));
  }

  checkout(shippingCost: number = 0): Observable<Order> {
    const currentCart = this.cart();

    if (!currentCart) {
      throw new Error('No active cart to checkout');
    }

    return this.cartApi
      .checkout(this.getUserId(), {
        cartId: currentCart.id,
        shippingCost,
      })
      .pipe(
        map((order) => {
          this.cartResource.reset();
          return order;
        }),
      );
  }

  private setupAuthEffect(): void {
    // React to changes in authentication state
    effect(() => {
      const hasGuestSession = !!this.authService.getGuestSessionId();
      const isLoggedIn = this.authService.isLoggedIn();
      const currentUserId = this.authService.userId();

      // Only load cart if user is logged in or has a guest session
      // Use untracked to prevent the effect from re-running when cart updates
      if (isLoggedIn || hasGuestSession) {
        untracked(() => this.loadCart());
      }
    });
  }

  private subscribeToLoginEvents(): void {
    this.authService.onLoginCompleted$.subscribe(() => {
      this.mergeGuestAndUserCarts();
    });
  }

  private mergeGuestAndUserCarts(): void {
    const guestId = this.authService.getGuestSessionId();

    if (!guestId) {
      this.reloadCart();
      return;
    }

    const account = this.authService.getActiveAccount();
    if (!account?.localAccountId) {
      return;
    }

    this.cartApi.migrateGuestCart({ guestId, userId: account.localAccountId }).subscribe({
      next: () => {
        this.authService.clearGuestSession();
        this.reloadCart();
      },
      error: () => {
        this.authService.clearGuestSession();
        this.reloadCart();
      },
    });
  }

  private getUserId(): string {
    return this.authService.userId();
  }

  private updateCart(cart: Cart, items: readonly CartItem[]): void {
    const updatedCart = this.cartHelper.recalculateCartTotals(cart, items);
    this.saveCart(updatedCart);
  }

  private saveCart(cart: Cart): void {
    this.cartResource.load(this.cartApi.upsertCart(this.getUserId(), cart));
  }
}
