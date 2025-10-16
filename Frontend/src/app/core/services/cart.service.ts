import { inject, Injectable, computed, effect, untracked } from '@angular/core';
import { map, Observable } from 'rxjs';

import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Resource } from '../../shared/utils/resource';
import { Product } from '../models/product.model';
import { AuthService } from '../auth/auth.service';
import { LoadingOverlayService } from './loading-overlay.service';
import { CartApiService } from './cart-api.service';

export type { CheckoutRequest } from './cart-api.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly authService = inject(AuthService);
  private readonly loadingOverlayService = inject(LoadingOverlayService);
  private readonly cartApi = inject(CartApiService);
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
    const userId = this.getUserId();
    this.cartResource.load(
      this.cartApi.addToCart(userId, {
        productId: product.id,
        sellerId: product.seller.id,
        quantity,
      }),
    );
  }

  removeFromCart(productId: string): void {
    const userId = this.getUserId();
    this.cartResource.load(
      this.cartApi.removeFromCart(userId, {
        productId,
      }),
    );
  }

  updateQuantity(productId: string, quantity: number): void {
    const userId = this.getUserId();
    const currentCart = this.cart();
    const item = currentCart?.items.find((i) => i.productId === productId);

    if (!item) return;

    this.cartResource.load(
      this.cartApi.updateQuantity(userId, {
        productId,
        sellerId: item.sellerId,
        quantity,
      }),
    );
  }

  clearCart(): void {
    this.cartResource.load(this.cartApi.clearCart(this.getUserId()));
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
}
