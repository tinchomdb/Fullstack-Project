import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter } from 'rxjs';

import { ProductFilters, ProductFiltersApiParams } from '../models/product-filters.model';
import { DEFAULT_SORT_OPTION, SORT_OPTIONS, SortOption } from '../models/sort-option.model';
import { CategoriesService } from './categories.service';
import { createBaseFilters, parseCommonFilters } from '../../shared/utils/query-params.util';

const DEFAULT_PAGE_SIZE = 20;

/** Routes that should trigger filter synchronization from URL */
const FILTER_ROUTES = ['/products', '/search', '/category'];

@Injectable({ providedIn: 'root' })
export class FiltersService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly categoriesService = inject(CategoriesService);

  // Signal-based state
  private readonly minPriceSignal = signal<number | null>(null);
  private readonly maxPriceSignal = signal<number | null>(null);
  private readonly currentSortOptionSignal = signal<SortOption>(DEFAULT_SORT_OPTION);
  private readonly pageSignal = signal(1);
  private readonly pageSizeSignal = signal(DEFAULT_PAGE_SIZE);
  private readonly categoryIdSignal = signal<string | null>(null);
  private readonly searchTermSignal = signal<string | null>(null);

  // Public readonly signals
  readonly minPrice = this.minPriceSignal.asReadonly();
  readonly maxPrice = this.maxPriceSignal.asReadonly();
  readonly currentSortOption = this.currentSortOptionSignal.asReadonly();
  readonly page = this.pageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly categoryId = this.categoryIdSignal.asReadonly();
  readonly searchTerm = this.searchTermSignal.asReadonly();

  // Computed signals derived from sort option
  readonly sortBy = computed(() => this.currentSortOption().sortBy);
  readonly sortDirection = computed(() => this.currentSortOption().sortDirection);

  readonly hasActiveFilters = computed(
    () =>
      this.currentSortOption().value !== DEFAULT_SORT_OPTION.value ||
      this.categoryId() !== null ||
      this.searchTerm() !== null,
  );

  readonly filters = computed<ProductFilters>(() => ({
    sortBy: this.sortBy(),
    sortDirection: this.sortDirection(),
    page: this.page(),
    pageSize: this.pageSize(),
    categoryId: this.categoryId(),
    searchTerm: this.searchTerm(),
  }));

  readonly apiParams = computed<ProductFiltersApiParams>(() => {
    const filters = this.filters();
    const params: ProductFiltersApiParams = {
      page: filters.page,
      pageSize: filters.pageSize,
      sortBy: filters.sortBy,
      sortDirection: filters.sortDirection,
    };

    if (filters.categoryId !== null) {
      params.categoryId = filters.categoryId;
    }

    if (filters.searchTerm !== null) {
      params.searchTerm = filters.searchTerm;
    }

    return params;
  });

  constructor() {
    this.setupRouterSync();
  }

  setSortOption(option: SortOption): void {
    this.currentSortOptionSignal.set(option);
    this.resetToFirstPage();
  }

  // Increment to next page for infinite scroll

  loadNextPage(): void {
    this.pageSignal.update((current) => current + 1);
  }

  setAllFilters(filters: Partial<ProductFilters>): void {
    if (filters.sortBy && filters.sortDirection) {
      const sortOption = SORT_OPTIONS.find(
        (opt) => opt.sortBy === filters.sortBy && opt.sortDirection === filters.sortDirection,
      );
      if (sortOption) {
        this.currentSortOptionSignal.set(sortOption);
      }
    }

    if (filters.page !== undefined && filters.page >= 1) {
      this.pageSignal.set(filters.page);
    }
    if (filters.pageSize !== undefined) {
      this.pageSizeSignal.set(filters.pageSize);
    }

    this.categoryIdSignal.set(filters.categoryId ?? null);

    this.searchTermSignal.set(filters.searchTerm?.trim() || null);
  }

  resetToFirstPage(): void {
    this.pageSignal.set(1);
  }

  private setupRouterSync(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter((event) => this.isFilterRoute(event.urlAfterRedirects)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.syncFiltersFromUrl();
      });
  }

  private isFilterRoute(url: string): boolean {
    const urlPath = url.split('?')[0];
    return FILTER_ROUTES.some((route) => urlPath.startsWith(route));
  }

  private syncFiltersFromUrl(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    const queryParams = urlTree.queryParams;
    const urlPath = urlTree.root.children['primary']?.segments.map((s) => s.path).join('/') || '';

    const filters = createBaseFilters();

    // Parse common filters from query params (minPrice, maxPrice, sortBy, sortDirection)
    Object.assign(filters, parseCommonFilters(queryParams));

    // Parse search term from query params
    if (typeof queryParams['q'] === 'string' && queryParams['q'].trim()) {
      filters.searchTerm = queryParams['q'].trim();
    }

    // Parse category from URL path (e.g., category/electronics/phones)
    if (urlPath.startsWith('category/')) {
      const categoryPath = urlPath.substring('category/'.length);
      if (categoryPath) {
        const category = this.categoriesService.getCategoryByPath(categoryPath);
        if (category) {
          filters.categoryId = category.id;
        }
      }
    }

    this.setAllFilters(filters);
  }
}
