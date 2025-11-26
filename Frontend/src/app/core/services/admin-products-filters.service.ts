import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  ProductFiltersApiParams,
  ProductSortField,
  SortDirection,
} from '../models/product-filters.model';

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

@Injectable({ providedIn: 'root' })
export class AdminProductsFiltersService {
  private readonly destroyRef = inject(DestroyRef);

  // Signal-based state
  private readonly pageSignal = signal(1);
  private readonly pageSizeSignal = signal(DEFAULT_PAGE_SIZE);
  private readonly categoryIdSignal = signal<string | null>(null);
  private readonly searchTermSignal = signal<string | null>(null);
  private readonly sortBySignal = signal<ProductSortField>('name');
  private readonly sortDirectionSignal = signal<SortDirection>('asc');

  // Debounced search input
  private readonly searchSubject = new Subject<string | null>();

  // Public readonly signals
  readonly page = this.pageSignal.asReadonly();
  readonly pageSize = this.pageSizeSignal.asReadonly();
  readonly categoryId = this.categoryIdSignal.asReadonly();
  readonly searchTerm = this.searchTermSignal.asReadonly();
  readonly sortBy = this.sortBySignal.asReadonly();
  readonly sortDirection = this.sortDirectionSignal.asReadonly();

  readonly hasActiveFilters = computed(
    () =>
      this.categoryId() !== null ||
      this.searchTerm() !== null ||
      this.sortBy() !== 'name' ||
      this.sortDirection() !== 'asc',
  );

  readonly apiParams = computed<ProductFiltersApiParams>(() => ({
    page: this.page(),
    pageSize: this.pageSize(),
    categoryId: this.categoryId() ?? undefined,
    searchTerm: this.searchTerm() ?? undefined,
    sortBy: this.sortBy(),
    sortDirection: this.sortDirection(),
  }));

  constructor() {
    this.setupSearchDebounce();
  }

  // === Public API ===

  setSearchTerm(term: string | null): void {
    this.searchSubject.next(term);
  }

  setCategoryId(categoryId: string | null): void {
    this.categoryIdSignal.set(categoryId);
    this.resetToFirstPage();
  }

  setSortBy(sortBy: ProductSortField, sortDirection: SortDirection = 'desc'): void {
    this.sortBySignal.set(sortBy);
    this.sortDirectionSignal.set(sortDirection);
    this.resetToFirstPage();
  }

  loadNextPage(): void {
    this.pageSignal.update((page) => page + 1);
  }

  resetToFirstPage(): void {
    this.pageSignal.set(1);
  }

  clearFilters(): void {
    this.searchTermSignal.set(null);
    this.categoryIdSignal.set(null);
    this.sortBySignal.set('name');
    this.sortDirectionSignal.set('asc');
    this.resetToFirstPage();
  }

  // === Private ===

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((term) => {
        this.searchTermSignal.set(term);
        this.resetToFirstPage();
      });
  }
}
