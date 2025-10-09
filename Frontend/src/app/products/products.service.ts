import { inject, Injectable, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { ProductApiModel } from '../models/api/product-api.model';
import { mapProductFromApi } from '../mappers/product.mapper';
import { Resource } from '../shared/utils/resource';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/api/products`;

  private readonly productsResource = new Resource<readonly Product[]>([]);

  readonly products = this.productsResource.data;
  readonly loading = this.productsResource.loading;
  readonly error = this.productsResource.error;

  readonly featuredProduct = computed(() => {
    const items = this.products() ?? [];
    return items.length ? items[0] : null;
  });

  readonly remainingProducts = computed(() => {
    const [, ...rest] = this.products() ?? [];
    return rest;
  });

  loadProducts(): void {
    this.productsResource.load(this.getProducts());
  }

  private getProducts(): Observable<readonly Product[]> {
    return this.http.get<readonly ProductApiModel[]>(this.baseUrl).pipe(
      map((items) => (Array.isArray(items) ? items : [])),
      map((items) => items.map(mapProductFromApi)),
    );
  }
}
