import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { CartApiModel } from '../models/api/cart-api.model';
import { OrderApiModel } from '../models/api/order-api.model';
import { mapCartFromApi } from '../mappers/cart.mapper';
import { mapOrderFromApi } from '../mappers/order.mapper';
import { AuthService } from '../auth/auth.service';
import { GuestAuthService } from '../auth/guest-auth.service';

export interface AddToCartRequest {
  productId: string;
  sellerId: string;
  quantity: number;
}

export interface UpdateQuantityRequest {
  productId: string;
  sellerId: string;
  quantity: number;
}

export interface CheckoutRequest {
  cartId: string;
  shippingCost: number;
}

export interface MigrateCartRequest {
  guestSessionId: string;
}

export interface ValidateCheckoutResponse {
  isValid: boolean;
  cartId: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  warnings: string[];
}

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly guestAuthService = inject(GuestAuthService);
  private readonly baseUrl = `${environment.apiBase}/api/carts`;

  private readonly isGuest = computed(() => !this.authService.isLoggedIn());

  getActiveCart(): Observable<Cart | null> {
    return this.http
      .get<CartApiModel | null>(this.getEndpoint(''))
      .pipe(map((response) => (response ? mapCartFromApi(response) : null)));
  }

  addToCart(request: AddToCartRequest): Observable<Cart> {
    return this.http
      .post<CartApiModel>(this.getEndpoint('/items'), request)
      .pipe(map(mapCartFromApi));
  }

  removeFromCart(productId: string): Observable<Cart> {
    return this.http
      .delete<CartApiModel>(`${this.getEndpoint('/items')}/${productId}`)
      .pipe(map(mapCartFromApi));
  }

  updateQuantity(request: UpdateQuantityRequest): Observable<Cart> {
    const endpoint = `${this.getEndpoint('/items')}/${request.productId}`;
    return this.http.patch<CartApiModel>(endpoint, request).pipe(map(mapCartFromApi));
  }

  clearCart(): Observable<Cart> {
    return this.http.delete<CartApiModel>(this.getEndpoint('')).pipe(map(mapCartFromApi));
  }

  checkout(request: CheckoutRequest): Observable<Order> {
    return this.http
      .post<OrderApiModel>(`${this.baseUrl}/my-cart/checkout`, request)
      .pipe(map(mapOrderFromApi));
  }

  validateCheckout(): Observable<ValidateCheckoutResponse> {
    return this.http.post<ValidateCheckoutResponse>(
      `${this.baseUrl}/my-cart/validate-checkout`,
      {},
    );
  }

  migrateGuestCart(): Observable<{ message: string }> {
    const sessionId = this.guestAuthService.requestGuestSessionId();

    if (!sessionId) {
      throw new Error('No guest session ID available for migration');
    }

    const request: MigrateCartRequest = { guestSessionId: sessionId };
    return this.http.post<{ message: string }>(`${this.baseUrl}/migrate`, request);
  }

  private getEndpoint(suffix: string): string {
    return this.isGuest()
      ? `${this.baseUrl}/guest-cart${suffix}`
      : `${this.baseUrl}/my-cart${suffix}`;
  }
}
