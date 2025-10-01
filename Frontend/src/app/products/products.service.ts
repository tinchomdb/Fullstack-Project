import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { ProductApiModel } from '../models/api/product-api.model';
import { mapProductFromApi } from '../mappers/product.mapper';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiBase}/api/products`;

  getProducts(): Observable<readonly Product[]> {
    return this.http.get<readonly ProductApiModel[]>(this.baseUrl).pipe(
      map((items) => (Array.isArray(items) ? items : [])),
      map((items) => items.map(mapProductFromApi)),
    );
  }
}
