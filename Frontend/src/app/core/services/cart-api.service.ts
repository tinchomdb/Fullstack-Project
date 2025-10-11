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

export interface CheckoutRequest {
  cartId: string;
  shippingCost: number;
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

  upsertCart(userId: string, cart: Cart): Observable<Cart> {
    return this.http
      .put<CartApiModel>(`${this.baseUrl}/by-user/${userId}`, cart)
      .pipe(map(mapCartFromApi));
  }

  deleteCart(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/by-user/${userId}`);
  }

  checkout(userId: string, request: CheckoutRequest): Observable<Order> {
    return this.http
      .post<OrderApiModel>(`${this.baseUrl}/by-user/${userId}/checkout`, request)
      .pipe(map(mapOrderFromApi));
  }

  migrateGuestCart(request: MigrateCartRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/migrate`, request);
  }
}
