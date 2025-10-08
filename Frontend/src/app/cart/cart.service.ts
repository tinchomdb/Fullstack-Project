import { inject, Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { Cart } from '../models/cart.model';
import { CartStatus } from '../models/cart-status.model';
import { Order } from '../models/order.model';
import { CartApiModel } from '../models/api/cart-api.model';
import { OrderApiModel } from '../models/api/order-api.model';
import { mapCartFromApi } from '../mappers/cart.mapper';
import { mapOrderFromApi } from '../mappers/order.mapper';
import { Resource } from '../shared/utils/resource';
import { Product } from '../models/product.model';
import { CartItem } from '../models/cart-item.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/api/carts`;

  // Hardcoded user ID for now (TODO: replace with auth service)
  private readonly userId = 'test-user-123';

  // Resource for cart data management
  private readonly cartResource = new Resource<Cart | null>(null);

  // Public reactive state
  readonly cart = this.cartResource.data;
  readonly loading = this.cartResource.loading;
  readonly error = this.cartResource.error;

  // Computed values for UI
  readonly itemCount = computed(() => {
    const cart = this.cart();
    return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  });

  readonly totalAmount = computed(() => this.cart()?.total ?? 0);

  readonly isEmpty = computed(() => this.itemCount() === 0);

  // Initialize cart on service creation
  constructor() {
    this.loadCart();
  }

  // Load cart from backend
  loadCart(): void {
    this.cartResource.load(this.getActiveCartByUser(this.userId));
  }

  // Add product to cart
  addToCart(product: Product, quantity: number = 1): Observable<Cart> {
    const currentCart = this.cart();

    if (!currentCart) {
      // Create new cart if none exists
      const newCart: Cart = {
        id: crypto.randomUUID(),
        userId: this.userId,
        status: CartStatus.Active,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        items: [
          {
            productId: product.id,
            productName: product.name,
            imageUrl: product.imageUrls[0] ?? '',
            quantity,
            unitPrice: product.price,
            lineTotal: product.price * quantity,
          },
        ],
        subtotal: product.price * quantity,
        currency: 'USD',
        total: product.price * quantity,
      };

      // Optimistic update
      this.cartResource.reset();
      this.cartResource.load(this.upsertCart(this.userId, newCart));
      return this.upsertCart(this.userId, newCart);
    }

    // Update existing cart
    const updatedCart = this.addItemToCart(currentCart, product, quantity);

    // Optimistic update
    this.cartResource.reset();
    this.cartResource.load(this.upsertCart(this.userId, updatedCart));
    return this.upsertCart(this.userId, updatedCart);
  }

  // Remove item from cart
  removeFromCart(productId: string): Observable<Cart | null> {
    const currentCart = this.cart();
    if (!currentCart) return of(null);

    const updatedCart = this.removeItemFromCart(currentCart, productId);

    // If cart becomes empty, delete it
    if (updatedCart.items.length === 0) {
      this.cartResource.reset();
      this.cartResource.load(this.deleteCart(this.userId).pipe(map(() => null)));
      return this.deleteCart(this.userId).pipe(map(() => null));
    }

    // Optimistic update
    this.cartResource.reset();
    this.cartResource.load(this.upsertCart(this.userId, updatedCart));
    return this.upsertCart(this.userId, updatedCart);
  }

  // Update item quantity
  updateQuantity(productId: string, quantity: number): Observable<Cart | null> {
    const currentCart = this.cart();
    if (!currentCart) return of(null);

    if (quantity <= 0) {
      return this.removeFromCart(productId);
    }

    const updatedCart = this.updateItemQuantity(currentCart, productId, quantity);

    // Optimistic update
    this.cartResource.reset();
    this.cartResource.load(this.upsertCart(this.userId, updatedCart));
    return this.upsertCart(this.userId, updatedCart);
  }

  // Clear entire cart
  clearCart(): Observable<void> {
    this.cartResource.reset();
    this.cartResource.load(this.deleteCart(this.userId).pipe(map(() => null)));
    return this.deleteCart(this.userId);
  }

  // Checkout cart and create order
  checkout(shippingCost: number = 0): Observable<Order> {
    const currentCart = this.cart();
    if (!currentCart) {
      throw new Error('No active cart to checkout');
    }

    return this.checkoutCart(this.userId, {
      cartId: currentCart.id,
      shippingCost,
    }).pipe(
      map((order) => {
        // Clear current cart after successful checkout
        this.cartResource.reset();
        this.loadCart(); // Load new empty cart
        return order;
      }),
    );
  }

  // Helper methods for cart manipulation
  private addItemToCart(cart: Cart, product: Product, quantity: number): Cart {
    const existingItemIndex = cart.items.findIndex((item) => item.productId === product.id);

    let updatedItems: readonly CartItem[];

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      const updatedItem: CartItem = {
        ...existingItem,
        quantity: newQuantity,
        lineTotal: existingItem.unitPrice * newQuantity,
      };

      updatedItems = [
        ...cart.items.slice(0, existingItemIndex),
        updatedItem,
        ...cart.items.slice(existingItemIndex + 1),
      ];
    } else {
      // Add new item
      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        imageUrl: product.imageUrls[0] ?? '',
        quantity,
        unitPrice: product.price,
        lineTotal: product.price * quantity,
      };

      updatedItems = [...cart.items, newItem];
    }

    return this.recalculateCartTotals(cart, updatedItems);
  }

  private removeItemFromCart(cart: Cart, productId: string): Cart {
    const updatedItems = cart.items.filter((item) => item.productId !== productId);
    return this.recalculateCartTotals(cart, updatedItems);
  }

  private updateItemQuantity(cart: Cart, productId: string, quantity: number): Cart {
    const updatedItems = cart.items.map((item) =>
      item.productId === productId
        ? { ...item, quantity, lineTotal: item.unitPrice * quantity }
        : item,
    );
    return this.recalculateCartTotals(cart, updatedItems);
  }

  private recalculateCartTotals(cart: Cart, items: readonly CartItem[]): Cart {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    return {
      ...cart,
      items,
      subtotal,
      total: subtotal, // For now, total = subtotal (no taxes/shipping)
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  // HTTP API methods
  private getActiveCartByUser(userId: string): Observable<Cart> {
    return this.http
      .get<CartApiModel>(`${this.baseUrl}/by-user/${userId}/active`)
      .pipe(map(mapCartFromApi));
  }

  private getCartByUser(userId: string): Observable<Cart> {
    return this.http
      .get<CartApiModel>(`${this.baseUrl}/by-user/${userId}`)
      .pipe(map(mapCartFromApi));
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
}

export interface CheckoutRequest {
  cartId: string;
  shippingCost: number;
}
