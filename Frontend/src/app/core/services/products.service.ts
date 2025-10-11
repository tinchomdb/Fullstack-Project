import { inject, Injectable, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { ProductApiModel } from '../models/api/product-api.model';
import { mapProductFromApi, mapProductToApi } from '../mappers/product.mapper';
import { Resource } from '../../shared/utils/resource';
import { LoadingOverlayService } from './loading-overlay.service';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly loadingOverlayService = inject(LoadingOverlayService);
  private readonly baseUrl = `${environment.apiBase}/api/products`;
  private readonly adminBaseUrl = `${environment.apiBase}/api/admin/products`;

  private readonly productsResource = new Resource<readonly Product[]>(
    [],
    'Loading products...',
    this.loadingOverlayService,
  );

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
    if (this.products() && this.products()!.length > 0) {
      return;
    }
    this.productsResource.load(this.getAllProducts());
  }

  reloadProducts(): void {
    this.productsResource.load(this.getAllProducts());
  }

  loadProductsByCategory(categoryId: string): void {
    this.productsResource.load(this.getProductsByCategory(categoryId));
  }

  loadProductsByCategories(categoryIds: string[]): void {
    if (!categoryIds || categoryIds.length === 0) {
      this.reloadProducts();
      return;
    }
    this.productsResource.load(this.getProductsByCategories(categoryIds));
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    const apiModel = mapProductToApi(product as Product);
    return this.http.post<ProductApiModel>(this.adminBaseUrl, apiModel).pipe(
      map(mapProductFromApi),
      tap(() => this.reloadProducts()),
    );
  }

  updateProduct(product: Product): Observable<Product> {
    const apiModel = mapProductToApi(product);
    return this.http
      .put<ProductApiModel>(
        `${this.adminBaseUrl}/${product.id}/seller/${product.sellerId}`,
        apiModel,
      )
      .pipe(
        map(mapProductFromApi),
        tap(() => this.reloadProducts()),
      );
  }

  deleteProduct(productId: string, sellerId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.adminBaseUrl}/${productId}/seller/${sellerId}`)
      .pipe(tap(() => this.reloadProducts()));
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

  private getProductsByCategory(categoryId: string): Observable<readonly Product[]> {
    return this.http
      .get<readonly ProductApiModel[]>(`${this.baseUrl}/by-category/${categoryId}`)
      .pipe(
        map((items) => (Array.isArray(items) ? items : [])),
        map((items) => items.map(mapProductFromApi)),
      );
  }

  private getProductsByCategories(categoryIds: string[]): Observable<readonly Product[]> {
    const params = categoryIds.map((id) => `categoryIds=${encodeURIComponent(id)}`).join('&');
    return this.http
      .get<readonly ProductApiModel[]>(`${this.baseUrl}/by-categories?${params}`)
      .pipe(
        map((items) => (Array.isArray(items) ? items : [])),
        map((items) => items.map(mapProductFromApi)),
      );
  }
}
