import { inject, Injectable, computed, effect, untracked, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError, finalize } from 'rxjs';

import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { Resource } from '../../shared/utils/resource';
import { Product } from '../models/product.model';
import { AuthService } from '../auth/auth.service';
import { GuestAuthService } from '../auth/guest-auth.service';
import { LoadingOverlayService } from './loading-overlay.service';
import { AlertService } from './alert.service';
import { CartApiService, type ValidateCheckoutResponse } from './cart-api.service';
import { OrderStateService } from './order-state.service';
import { ToastService } from './toast.service';

export type { CheckoutRequest } from './cart-api.service';
export type { ValidateCheckoutResponse } from './cart-api.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly authService = inject(AuthService);
  private readonly guestAuthService = inject(GuestAuthService);
  private readonly loadingOverlayService = inject(LoadingOverlayService);
  private readonly alertService = inject(AlertService);
  private readonly cartApi = inject(CartApiService);
  private readonly orderState = inject(OrderStateService);
  private readonly toastService = inject(ToastService);

  private readonly cartResource = new Resource<Cart | null>(
    null,
    'Loading cart...',
    this.loadingOverlayService,
  );

  // Public signals
  readonly cart = this.cartResource.data;
  readonly loading = this.cartResource.loading;
  readonly error = this.cartResource.error;
  readonly cartUserId = computed(() => this.cart()?.userId ?? null);
  readonly cartReady = signal(false);

  // Computed properties
  readonly itemCount = computed(
    () => this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
  );

  readonly totalAmount = computed(() => this.cart()?.total ?? 0);
  readonly isEmpty = computed(() => this.itemCount() === 0);

  constructor() {
    effect(() => {
      const authInitialized = this.authService.authInitialized();
      if (!authInitialized) {
        return;
      }

      const isLoggedIn = this.authService.isLoggedIn();
      untracked(() => {
        if (isLoggedIn && this.guestAuthService.hasToken()) {
          // User logged in - migrate guest cart if exists, then load user cart
          this.mergeGuestAndUserCarts();
        } else {
          // User logged out or no guest token - load cart (would be guest cart)
          this.loadCart();
        }
      });
    });
  }

  loadCart(): void {
    this.cartResource.load(
      this.cartApi.getActiveCart().pipe(
        tap({
          next: () => this.cartReady.set(true),
          error: () => this.cartReady.set(true),
        }),
      ),
    );
  }

  addToCart(product: Product, quantity = 1): void {
    this.cartResource.load(
      this.cartApi
        .addToCart({
          productId: product.id,
          sellerId: product.seller.id,
          quantity,
        })
        .pipe(
          tap(() => this.toastService.success(`${product.name} added to cart`)),
          catchError((error) => this.handleStockError(error)),
        ),
      false,
    );
  }

  removeFromCart(productId: string): void {
    this.cartResource.load(
      this.cartApi
        .removeFromCart(productId)
        .pipe(tap(() => this.toastService.info('Item removed from cart'))),
      false,
    );
  }

  updateQuantity(productId: string, quantity: number): void {
    const item = this.cart()?.items.find((i) => i.productId === productId);
    if (!item) return;

    this.cartResource.load(
      this.cartApi
        .updateQuantity({
          productId,
          sellerId: item.sellerId,
          quantity,
        })
        .pipe(catchError((error) => this.handleStockError(error))),
      false,
    );
  }

  clearCart(): void {
    this.cartResource.load(
      this.cartApi.clearCart().pipe(tap(() => this.toastService.info('Cart cleared'))),
      false,
    );
  }

  checkout(shippingCost = 0): Observable<Order> {
    const currentCart = this.cart();
    if (!currentCart) throw new Error('No active cart to checkout');

    return this.cartApi.checkout({ cartId: currentCart.id, shippingCost }).pipe(
      tap((order) => this.orderState.setLastOrder(order)),
      map((order) => {
        this.cartResource.reset();
        return order;
      }),
    );
  }

  validateCheckout(): Observable<ValidateCheckoutResponse> {
    const currentCart = this.cart();
    if (!currentCart) throw new Error('No active cart to validate');
    return this.cartApi.validateCheckout();
  }

  private mergeGuestAndUserCarts(): void {
    this.cartApi
      .migrateGuestCart()
      .pipe(
        finalize(() => {
          this.guestAuthService.clearToken();
          this.loadCart();
        }),
      )
      .subscribe();
  }

  private handleStockError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      const availableStock = error.error?.availableStock;
      const message =
        availableStock !== undefined
          ? `Not enough stock available. Only ${availableStock} item(s) in stock.`
          : 'This product is currently out of stock.';

      this.alertService.show(message);
      this.toastService.error(message);
    }

    return throwError(() => error);
  }
}
