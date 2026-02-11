import { Injectable, inject, effect, computed, untracked, InjectionToken } from '@angular/core';
import { ProductsService } from '../services/products.service';
import { FiltersService } from '../services/filters.service';

export interface ProductListConfig {
  loadFeatured: boolean;
  featuredLimit: number;
}

export const PRODUCT_LIST_CONFIG = new InjectionToken<ProductListConfig>('ProductListConfig', {
  providedIn: null,
  factory: () => ({ loadFeatured: false, featuredLimit: 6 }),
});

/**
 * Orchestrates product listing with filtering and infinite scroll.
 * Automatically reloads when ANY filter changes.
 *
 * Configure via DI: { provide: PRODUCT_LIST_CONFIG, useValue: { loadFeatured: true } }
 */
@Injectable()
export class ProductListManager {
  private readonly productsService = inject(ProductsService);
  private readonly filtersService = inject(FiltersService);
  private readonly config = inject(PRODUCT_LIST_CONFIG);

  readonly products = this.productsService.products;
  readonly isLoadingInitial = this.productsService.loading;
  readonly isLoadingMore = this.productsService.loadingMore;
  readonly hasMore = this.productsService.hasMore;
  readonly error = this.productsService.error;
  readonly currentPage = this.productsService.currentPage;
  readonly totalCount = this.productsService.totalCount;
  readonly featuredProducts = this.productsService.featuredProducts;
  readonly isLoading = computed(() => this.isLoadingInitial() || this.isLoadingMore());

  constructor() {
    effect(() => {
      this.filtersService.categoryId();
      this.filtersService.minPrice();
      this.filtersService.maxPrice();
      this.filtersService.sortBy();
      this.filtersService.sortDirection();
      this.filtersService.searchTerm();

      untracked(() => {
        this.filtersService.resetToFirstPage();
        this.loadProductList();
      });
    });

    if (this.config.loadFeatured) {
      effect(() => {
        const categoryId = this.filtersService.categoryId() ?? undefined;

        untracked(() => {
          this.productsService.loadFeaturedProducts(categoryId, this.config.featuredLimit);
        });
      });
    }
  }

  loadMore(): void {
    this.filtersService.loadNextPage();
    this.productsService.loadMoreProducts(this.filtersService.apiParams());
  }

  private loadProductList(): void {
    this.productsService.loadProducts(this.filtersService.apiParams());
  }
}
