import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private readonly destroyRef = inject(DestroyRef);

  // Signal-based state
  private readonly minPriceSignal = signal<number | null>(null);
  private readonly maxPriceSignal = signal<number | null>(null);
  private readonly currentSortOptionSignal = signal<SortOption>(DEFAULT_SORT_OPTION);
  private readonly pageSignal = signal(1);
  private readonly pageSizeSignal = signal(DEFAULT_PAGE_SIZE);
  private readonly categoryIdSignal = signal<string | null>(null);
  private readonly searchTermSignal = signal<string | null>(null);

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
  readonly searchTerm = this.searchTermSignal.asReadonly();

  // Computed signals derived from sort option
  readonly sortBy = computed(() => this.currentSortOption().sortBy);
  readonly sortDirection = computed(() => this.currentSortOption().sortDirection);

  readonly hasActiveFilters = computed(
    () =>
      this.minPrice() !== null ||
      this.maxPrice() !== null ||
      this.currentSortOption().value !== DEFAULT_SORT_OPTION.value ||
      this.categoryId() !== null ||
      this.searchTerm() !== null,
  );

  readonly filters = computed<ProductFilters>(() => ({
    minPrice: this.minPrice(),
    maxPrice: this.maxPrice(),
    sortBy: this.sortBy(),
    sortDirection: this.sortDirection(),
    page: this.page(),
    pageSize: this.pageSize(),
    categoryId: this.categoryId(),
    searchTerm: this.searchTerm(),
  }));

  constructor() {
    // Setup debounced price inputs
    this.setupPriceDebounce();
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

  // Increment to next page for infinite scroll

  loadNextPage(): void {
    this.pageSignal.update((current) => current + 1);
  }

  setCategoryId(categoryId: string | null): void {
    this.categoryIdSignal.set(categoryId);
    this.resetToFirstPage();
  }

  setSearchTerm(searchTerm: string | null): void {
    const trimmed = searchTerm?.trim() || null;
    console.log('Setting search term:', trimmed);
    this.resetFilters();
    this.searchTermSignal.set(trimmed);
  }

  setAllFilters(filters: Partial<ProductFilters>): void {
    if (filters.minPrice !== undefined) {
      this.setMinPrice(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      this.setMaxPrice(filters.maxPrice);
    }
    if (filters.sortBy && filters.sortDirection) {
      const sortOption = SORT_OPTIONS.find(
        (opt) => opt.sortBy === filters.sortBy && opt.sortDirection === filters.sortDirection,
      );
      if (sortOption) {
        this.currentSortOptionSignal.set(sortOption);
      }
    }
    if (filters.page !== undefined) {
      this.setPage(filters.page);
    }
    if (filters.pageSize !== undefined) {
      this.pageSizeSignal.set(filters.pageSize);
    }
    if (filters.categoryId !== undefined) {
      this.categoryIdSignal.set(filters.categoryId);
    } else {
      this.categoryIdSignal.set(null);
    }
    if (filters.searchTerm !== undefined) {
      this.searchTermSignal.set(filters.searchTerm?.trim() || null);
    } else {
      this.searchTermSignal.set(null);
    }
  }

  resetFilters(): void {
    this.minPriceSignal.set(null);
    this.maxPriceSignal.set(null);
    this.currentSortOptionSignal.set(DEFAULT_SORT_OPTION);
    this.categoryIdSignal.set(null);
    this.searchTermSignal.set(null);
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

    if (filters.searchTerm !== null) {
      params.searchTerm = filters.searchTerm;
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
}
