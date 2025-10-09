import { inject, Injectable, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Product } from '../../models/product.model';
import { ProductApiModel } from '../../models/api/product-api.model';
import { mapProductFromApi, mapProductToApi } from '../../mappers/product.mapper';
import { Resource } from '../utils/resource';

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
    this.productsResource.load(this.getAllProducts());
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    const apiModel = mapProductToApi(product as Product);
    return this.http.post<ProductApiModel>(this.baseUrl, apiModel).pipe(
      map(mapProductFromApi),
      tap(() => this.loadProducts()),
    );
  }

  updateProduct(product: Product): Observable<Product> {
    const apiModel = mapProductToApi(product);
    return this.http
      .put<ProductApiModel>(`${this.baseUrl}/${product.id}/seller/${product.sellerId}`, apiModel)
      .pipe(
        map(mapProductFromApi),
        tap(() => this.loadProducts()),
      );
  }

  deleteProduct(productId: string, sellerId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${productId}/seller/${sellerId}`)
      .pipe(tap(() => this.loadProducts()));
  }

  getProduct(productId: string, sellerId: string): Observable<Product> {
    return this.http
      .get<ProductApiModel>(`${this.baseUrl}/${productId}/seller/${sellerId}`)
      .pipe(map(mapProductFromApi));
  }

  private getAllProducts(): Observable<readonly Product[]> {
    return this.http.get<readonly ProductApiModel[]>(this.baseUrl).pipe(
      map((items) => (Array.isArray(items) ? items : [])),
      map((items) => items.map(mapProductFromApi)),
    );
  }
}
