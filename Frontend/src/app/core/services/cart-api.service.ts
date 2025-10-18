import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { CartApiModel } from '../models/api/cart-api.model';
import { OrderApiModel } from '../models/api/order-api.model';
import { mapCartFromApi } from '../mappers/cart.mapper';
import { mapOrderFromApi } from '../mappers/order.mapper';

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

export interface RemoveFromCartRequest {
  productId: string;
}

export interface CheckoutRequest {
  cartId: string;
  shippingCost: number;
}

export interface ValidateCheckoutResponse {
  isValid: boolean;
  cartId: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  warnings: string[];
}

export interface MigrateCartRequest {
  guestId: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/api/carts`;

  getActiveCartByUser(userId: string): Observable<Cart | null> {
    return this.http
      .get<CartApiModel | null>(`${this.baseUrl}/by-user/${userId}/active`)
      .pipe(map((response) => (response ? mapCartFromApi(response) : null)));
  }

  addToCart(userId: string, request: AddToCartRequest): Observable<Cart> {
    return this.http
      .post<CartApiModel>(`${this.baseUrl}/by-user/${userId}/items`, request)
      .pipe(map(mapCartFromApi));
  }

  removeFromCart(userId: string, request: RemoveFromCartRequest): Observable<Cart> {
    return this.http
      .delete<CartApiModel>(`${this.baseUrl}/by-user/${userId}/items/${request.productId}`, {
        body: request,
      })
      .pipe(map(mapCartFromApi));
  }

  updateQuantity(userId: string, request: UpdateQuantityRequest): Observable<Cart> {
    return this.http
      .patch<CartApiModel>(`${this.baseUrl}/by-user/${userId}/items/${request.productId}`, request)
      .pipe(map(mapCartFromApi));
  }

  clearCart(userId: string): Observable<Cart> {
    return this.http
      .delete<CartApiModel>(`${this.baseUrl}/by-user/${userId}`)
      .pipe(map(mapCartFromApi));
  }

  checkout(userId: string, request: CheckoutRequest): Observable<Order> {
    return this.http
      .post<OrderApiModel>(`${this.baseUrl}/by-user/${userId}/checkout`, request)
      .pipe(map(mapOrderFromApi));
  }

  validateCheckout(userId: string, cartId: string): Observable<ValidateCheckoutResponse> {
    return this.http.post<ValidateCheckoutResponse>(
      `${this.baseUrl}/by-user/${userId}/validate-checkout`,
      { cartId },
    );
  }

  migrateGuestCart(request: MigrateCartRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/migrate`, request);
  }
}
