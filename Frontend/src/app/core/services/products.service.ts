import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { ProductApiModel } from '../models/api/product-api.model';
import { mapProductFromApi, mapProductToApi } from '../mappers/product.mapper';
import { InfiniteScrollResource } from '../../shared/utils/infinite-scroll-resource';
import { PaginatedResponse } from '../models/paginated-response.model';
import { ProductFiltersApiParams } from '../models/product-filters.model';
import { LoadingOverlayService } from './loading-overlay.service';
import { Resource } from '../../shared/utils/resource';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly loadingOverlayService = inject(LoadingOverlayService);
  private readonly baseUrl = `${environment.apiBase}/api/products`;
  private readonly adminBaseUrl = `${environment.apiBase}/api/admin/products`;

  private readonly productsResource = new InfiniteScrollResource<Product>(
    'Loading products...',
    this.loadingOverlayService,
  );

  readonly products = this.productsResource.items;
  readonly totalCount = this.productsResource.totalCount;
  readonly totalPages = this.productsResource.totalPages;
  readonly currentPage = this.productsResource.currentPage;
  readonly loading = this.productsResource.loading;
  readonly loadingMore = this.productsResource.loadingMore;
  readonly hasMore = this.productsResource.hasMore;
  readonly error = this.productsResource.error;
  readonly hasData = this.productsResource.hasData;

  private readonly featuredProductsResource = new Resource<Product[]>(
    [],
    'Loading featured products...',
    this.loadingOverlayService,
  );

  readonly featuredProducts = this.featuredProductsResource.data;
  readonly featuredProductsLoading = this.featuredProductsResource.loading;
  readonly featuredProductsError = this.featuredProductsResource.error;

  loadProducts(filters: ProductFiltersApiParams = {}): void {
    this.productsResource.load(this.getFilteredProducts(filters));
  }

  loadMoreProducts(filters: ProductFiltersApiParams = {}): void {
    this.productsResource.loadMore(this.getFilteredProducts(filters));
  }

  reloadProducts(): void {
    this.loadProducts();
  }

  loadFeaturedProducts(categoryId?: string): void {
    this.featuredProductsResource.load(this.getFeaturedProducts(categoryId));
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

  getProductBySlug(slug: string): Observable<Product> {
    return this.http
      .get<ProductApiModel>(`${this.baseUrl}/by-slug/${slug}`)
      .pipe(map(mapProductFromApi));
  }

  buildProductUrl(product: Product): string {
    return `/products/${product.slug}`;
  }

  private getFeaturedProducts(categoryId?: string): Observable<Product[]> {
    let params = new HttpParams();

    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }

    return this.http
      .get<ProductApiModel[]>(`${this.baseUrl}/featured`, { params })
      .pipe(map((products) => products.map(mapProductFromApi)));
  }

  private getFilteredProducts(
    filters: ProductFiltersApiParams,
  ): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams();

    if (filters.minPrice !== undefined) {
      params = params.set('minPrice', filters.minPrice.toString());
    }

    if (filters.maxPrice !== undefined) {
      params = params.set('maxPrice', filters.maxPrice.toString());
    }

    if (filters.sortBy !== undefined) {
      params = params.set('sortBy', filters.sortBy);
    }

    if (filters.sortDirection !== undefined) {
      params = params.set('sortDirection', filters.sortDirection);
    }

    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }

    if (filters.pageSize !== undefined) {
      params = params.set('pageSize', filters.pageSize.toString());
    }

    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }

    if (filters.searchTerm) {
      params = params.set('searchTerm', filters.searchTerm);
    }

    return this.http.get<PaginatedResponse<ProductApiModel>>(`${this.baseUrl}`, { params }).pipe(
      map((response) => ({
        ...response,
        items: response.items.map(mapProductFromApi),
      })),
    );
  }
}
