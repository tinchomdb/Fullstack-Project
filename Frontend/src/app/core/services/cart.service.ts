import { inject, Injectable, computed, effect } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, Observable, of, catchError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Cart } from '../models/cart.model';
import { CartStatus } from '../models/cart-status.model';
import { Order } from '../models/order.model';
import { CartApiModel } from '../models/api/cart-api.model';
import { OrderApiModel } from '../models/api/order-api.model';
import { mapCartFromApi } from '../mappers/cart.mapper';
import { mapOrderFromApi } from '../mappers/order.mapper';
import { Resource } from '../../shared/utils/resource';
import { Product } from '../models/product.model';
import { CartItem } from '../models/cart-item.model';
import { AuthService } from '../auth/auth.service';

export interface CheckoutRequest {
  cartId: string;
  shippingCost: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiBase}/api/carts`;
  private readonly cartResource = new Resource<Cart | null>(null);

  readonly cart = this.cartResource.data;
  readonly loading = this.cartResource.loading;
  readonly error = this.cartResource.error;

  readonly itemCount = computed(() => {
    const cart = this.cart();
    return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  });

  readonly totalAmount = computed(() => this.cart()?.total ?? 0);
  readonly isEmpty = computed(() => this.itemCount() === 0);

  constructor() {
    this.initializeCart();
    this.setupLoginEffect();
  }

  loadCart(): void {
    const userId = this.authService.userId();
    this.cartResource.load(this.getActiveCartByUser(userId));
  }

  addToCart(product: Product, quantity: number = 1): void {
    const userId = this.authService.userId();
    const currentCart = this.cart();

    if (!currentCart) {
      const newCart = this.createNewCart(userId, product, quantity);
      this.saveCart(userId, newCart);
      return;
    }

    const existingItemIndex = currentCart.items.findIndex((item) => item.productId === product.id);

    const updatedItems =
      existingItemIndex >= 0
        ? this.updateExistingItem(currentCart.items, existingItemIndex, quantity)
        : this.addNewItem(currentCart.items, product, quantity);

    const updatedCart = this.recalculateCartTotals(currentCart, updatedItems);
    this.saveCart(userId, updatedCart);
  }

  removeFromCart(productId: string): void {
    const userId = this.authService.userId();
    const currentCart = this.cart();
    if (!currentCart) return;

    const updatedItems = currentCart.items.filter((item) => item.productId !== productId);

    if (updatedItems.length === 0) {
      this.cartResource.load(this.deleteCart(userId).pipe(map(() => null)));
      return;
    }

    const updatedCart = this.recalculateCartTotals(currentCart, updatedItems);
    this.saveCart(userId, updatedCart);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    const userId = this.authService.userId();
    const currentCart = this.cart();
    if (!currentCart) return;

    const updatedItems = currentCart.items.map((item) =>
      item.productId === productId
        ? { ...item, quantity, lineTotal: item.unitPrice * quantity }
        : item,
    );

    const updatedCart = this.recalculateCartTotals(currentCart, updatedItems);
    this.saveCart(userId, updatedCart);
  }

  clearCart(): void {
    const userId = this.authService.userId();
    this.cartResource.load(this.deleteCart(userId).pipe(map(() => null)));
  }

  checkout(shippingCost: number = 0): Observable<Order> {
    const userId = this.authService.userId();
    const currentCart = this.cart();

    if (!currentCart) {
      throw new Error('No active cart to checkout');
    }

    return this.checkoutCart(userId, {
      cartId: currentCart.id,
      shippingCost,
    }).pipe(
      map((order) => {
        this.cartResource.reset();
        return order;
      }),
    );
  }

  private initializeCart(): void {
    const hasGuestSession = !!this.authService.getGuestSessionId();
    const isLoggedIn = this.authService.isLoggedIn();

    if (isLoggedIn || hasGuestSession) {
      this.loadCart();
    }
  }

  private setupLoginEffect(): void {
    effect(() => {
      const isLoggedIn = this.authService.isLoggedIn();
      if (isLoggedIn) {
        this.mergeGuestAndUserCarts();
      }
    });
  }

  private mergeGuestAndUserCarts(): void {
    const guestId = this.authService.getGuestSessionId();

    if (!guestId) {
      this.loadCart();
      return;
    }

    const account = this.authService.getActiveAccount();
    if (!account?.localAccountId) {
      return;
    }

    this.migrateGuestCart(guestId, account.localAccountId).subscribe({
      next: () => {
        this.authService.clearGuestSession();
        this.loadCart();
      },
      error: () => {
        this.authService.clearGuestSession();
        this.loadCart();
      },
    });
  }

  private createNewCart(userId: string, product: Product, quantity: number): Cart {
    const cartItem = this.createCartItem(product, quantity);
    const itemTotal = product.price * quantity;

    return {
      id: crypto.randomUUID(),
      userId,
      status: CartStatus.Active,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      items: [cartItem],
      subtotal: itemTotal,
      currency: 'USD',
      total: itemTotal,
    };
  }

  private createCartItem(product: Product, quantity: number): CartItem {
    return {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrls[0] ?? '',
      quantity,
      unitPrice: product.price,
      lineTotal: product.price * quantity,
    };
  }

  private updateExistingItem(
    items: readonly CartItem[],
    index: number,
    quantityToAdd: number,
  ): readonly CartItem[] {
    const existingItem = items[index];
    const newQuantity = existingItem.quantity + quantityToAdd;
    const updatedItem: CartItem = {
      ...existingItem,
      quantity: newQuantity,
      lineTotal: existingItem.unitPrice * newQuantity,
    };

    return [...items.slice(0, index), updatedItem, ...items.slice(index + 1)];
  }

  private addNewItem(
    items: readonly CartItem[],
    product: Product,
    quantity: number,
  ): readonly CartItem[] {
    const newItem = this.createCartItem(product, quantity);
    return [...items, newItem];
  }

  private recalculateCartTotals(cart: Cart, items: readonly CartItem[]): Cart {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
      ...cart,
      items,
      subtotal,
      total: subtotal,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  private saveCart(userId: string, cart: Cart): void {
    this.cartResource.load(this.upsertCart(userId, cart));
  }

  private getActiveCartByUser(userId: string): Observable<Cart | null> {
    return this.http.get<CartApiModel>(`${this.baseUrl}/by-user/${userId}/active`).pipe(
      map(mapCartFromApi),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }
        throw error;
      }),
    );
  }

  private upsertCart(userId: string, cart: Cart): Observable<Cart> {
    return this.http
      .put<CartApiModel>(`${this.baseUrl}/by-user/${userId}`, cart)
      .pipe(map(mapCartFromApi));
  }

  private deleteCart(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/by-user/${userId}`);
  }

  private checkoutCart(userId: string, request: CheckoutRequest): Observable<Order> {
    return this.http
      .post<OrderApiModel>(`${this.baseUrl}/by-user/${userId}/checkout`, request)
      .pipe(map(mapOrderFromApi));
  }

  private migrateGuestCart(guestId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/migrate`, { guestId, userId });
  }
}
