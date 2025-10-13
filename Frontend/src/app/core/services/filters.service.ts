import { Injectable, inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import {
  ProductFilters,
  ProductFiltersApiParams,
  ProductSortField,
  SortDirection,
} from '../models/product-filters.model';
import { DEFAULT_SORT_OPTION, SORT_OPTIONS, SortOption } from '../models/sort-option.model';

const DEFAULT_PAGE_SIZE = 20;
const PRICE_DEBOUNCE_MS = 500;

@Injectable({ providedIn: 'root' })
export class FiltersService {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Signal-based state
  private readonly minPriceSignal = signal<number | null>(null);
  private readonly maxPriceSignal = signal<number | null>(null);
  private readonly currentSortOptionSignal = signal<SortOption>(DEFAULT_SORT_OPTION);
  private readonly pageSignal = signal(1);
  private readonly pageSizeSignal = signal(DEFAULT_PAGE_SIZE);
  private readonly categoryIdSignal = signal<string | null>(null);

  // Flag to track initialization
  private isInitialized = false;

  // Debounced price inputs
  private readonly minPriceSubject = new Subject<number | null>();
  private readonly maxPriceSubject = new Subject<number | null>();

  // Public readonly signals
  readonly minPrice = this.minPriceSignal.asReadonly();
  readonly maxPrice = this.maxPriceSignal.asReadonly();
  readonly currentSortOption = this.currentSortOptionSignal.asReadonly();
  readonly page = this.pageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly categoryId = this.categoryIdSignal.asReadonly();

  // Computed signals derived from sort option
  readonly sortBy = computed(() => this.currentSortOption().sortBy);
  readonly sortDirection = computed(() => this.currentSortOption().sortDirection);

  readonly hasActiveFilters = computed(
    () =>
      this.minPrice() !== null ||
      this.maxPrice() !== null ||
      this.currentSortOption().value !== DEFAULT_SORT_OPTION.value ||
      this.categoryId() !== null,
  );

  readonly filters = computed<ProductFilters>(() => ({
    minPrice: this.minPrice(),
    maxPrice: this.maxPrice(),
    sortBy: this.sortBy(),
    sortDirection: this.sortDirection(),
    page: this.page(),
    pageSize: this.pageSize(),
    categoryId: this.categoryId(),
  }));

  // Observable for query params
  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} });

  constructor() {
    // Setup debounced price inputs
    this.setupPriceDebounce();

    // Sync URL params to internal state
    this.syncFromUrl();

    // Sync internal state to URL
    this.syncToUrl();
  }

  // === Public API ===

  setMinPrice(value: number | null): void {
    this.minPriceSubject.next(value);
  }

  setMaxPrice(value: number | null): void {
    this.maxPriceSubject.next(value);
  }

  setSortOption(option: SortOption): void {
    this.currentSortOptionSignal.set(option);
    this.resetToFirstPage();
  }

  setPage(page: number): void {
    if (page < 1) return;
    this.pageSignal.set(page);
  }

  setCategoryId(categoryId: string | null): void {
    this.categoryIdSignal.set(categoryId);
    this.resetToFirstPage();
  }

  resetFilters(): void {
    this.minPriceSignal.set(null);
    this.maxPriceSignal.set(null);
    this.currentSortOptionSignal.set(DEFAULT_SORT_OPTION);
    this.categoryIdSignal.set(null);
    this.resetToFirstPage();
  }

  resetToFirstPage(): void {
    this.pageSignal.set(1);
  }

  buildApiParams(): ProductFiltersApiParams {
    const filters = this.filters();
    const params: ProductFiltersApiParams = {
      page: filters.page,
      pageSize: filters.pageSize,
      sortBy: filters.sortBy,
      sortDirection: filters.sortDirection,
    };

    if (filters.minPrice !== null) {
      params.minPrice = filters.minPrice;
    }

    if (filters.maxPrice !== null) {
      params.maxPrice = filters.maxPrice;
    }

    if (filters.categoryId !== null) {
      params.categoryId = filters.categoryId;
    }

    return params;
  }

  // === Private methods ===

  private setupPriceDebounce(): void {
    const createDebouncedStream = (subject: Subject<number | null>) =>
      subject.pipe(
        debounceTime(PRICE_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      );

    createDebouncedStream(this.minPriceSubject).subscribe((value) => {
      this.minPriceSignal.set(value);
      this.resetToFirstPage();
    });

    createDebouncedStream(this.maxPriceSubject).subscribe((value) => {
      this.maxPriceSignal.set(value);
      this.resetToFirstPage();
    });
  }

  private syncFromUrl(): void {
    effect(
      () => {
        const params = this.queryParams() as Record<string, string | undefined>;

        this.parseAndSetPrice(params['minPrice'], this.minPriceSignal);
        this.parseAndSetPrice(params['maxPrice'], this.maxPriceSignal);
        this.parseAndSetSort(params['sortBy'], params['sortDirection']);
        this.parseAndSetPage(params['page']);
        this.parseAndSetCategory(params['category']);

        // Mark as initialized after first URL sync
        if (!this.isInitialized) {
          this.isInitialized = true;
        }
      },
      { allowSignalWrites: true },
    );
  }

  private parseAndSetPrice(value: string | undefined, signal: typeof this.minPriceSignal): void {
    if (value !== undefined) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed) && parsed >= 0) {
        signal.set(parsed);
      }
    }
  }

  private parseAndSetSort(sortBy: string | undefined, sortDirection: string | undefined): void {
    if (
      sortBy &&
      sortDirection &&
      (sortBy === 'name' || sortBy === 'price') &&
      (sortDirection === 'asc' || sortDirection === 'desc')
    ) {
      const option = SORT_OPTIONS.find(
        (opt) =>
          opt.sortBy === (sortBy as ProductSortField) &&
          opt.sortDirection === (sortDirection as SortDirection),
      );
      if (option) {
        this.currentSortOptionSignal.set(option);
      }
    }
  }

  private parseAndSetPage(value: string | undefined): void {
    if (value !== undefined) {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        this.pageSignal.set(parsed);
      }
    }
  }

  private parseAndSetCategory(category: string | undefined): void {
    if (category) {
      this.categoryIdSignal.set(category);
    } else {
      this.categoryIdSignal.set(null);
    }
  }

  private syncToUrl(): void {
    effect(
      () => {
        // Skip the first run to avoid sync loop with syncFromUrl
        if (!this.isInitialized) {
          return;
        }

        const filters = this.filters();
        const queryParams = this.buildQueryParams(filters);

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams,
          replaceUrl: true,
        });
      },
      { allowSignalWrites: true },
    );
  }

  private buildQueryParams(filters: ProductFilters): Record<string, string> {
    const params: Record<string, string> = {};

    if (filters.minPrice !== null) {
      params['minPrice'] = filters.minPrice.toString();
    }

    if (filters.maxPrice !== null) {
      params['maxPrice'] = filters.maxPrice.toString();
    }

    const isDefaultSort =
      filters.sortBy === DEFAULT_SORT_OPTION.sortBy &&
      filters.sortDirection === DEFAULT_SORT_OPTION.sortDirection;

    if (!isDefaultSort) {
      params['sortBy'] = filters.sortBy;
      params['sortDirection'] = filters.sortDirection;
    }

    if (filters.page > 1) {
      params['page'] = filters.page.toString();
    }

    if (filters.categoryId !== null) {
      params['category'] = filters.categoryId;
    }

    return params;
  }
}
