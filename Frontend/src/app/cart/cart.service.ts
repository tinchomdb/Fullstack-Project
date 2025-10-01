import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Cart } from '../models/cart.model';
import { CartApiModel } from '../models/api/cart-api.model';
import { mapCartFromApi } from '../mappers/cart.mapper';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiBase}/api/carts`;

  getCurrentCart(): Observable<Cart> {
    return this.http.get<CartApiModel>(`${this.baseUrl}/current`).pipe(map(mapCartFromApi));
  }

  getCart(cartId: string): Observable<Cart> {
    return this.http.get<CartApiModel>(`${this.baseUrl}/${cartId}`).pipe(map(mapCartFromApi));
  }

  getCartByUser(userId: string): Observable<Cart> {
    return this.http
      .get<CartApiModel>(`${this.baseUrl}/by-user/${userId}`)
      .pipe(map(mapCartFromApi));
  }
}
