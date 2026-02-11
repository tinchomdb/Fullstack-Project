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

  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly categoryId = signal<string | null>(null);
  readonly searchTerm = signal<string | null>(null);
  readonly sortBy = signal<ProductSortField>('name');
  readonly sortDirection = signal<SortDirection>('asc');

  private readonly searchSubject = new Subject<string | null>();

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
    this.categoryId.set(categoryId);
    this.resetToFirstPage();
  }

  setSortBy(sortBy: ProductSortField, sortDirection: SortDirection = 'desc'): void {
    this.sortBy.set(sortBy);
    this.sortDirection.set(sortDirection);
    this.resetToFirstPage();
  }

  loadNextPage(): void {
    this.page.update((page) => page + 1);
  }

  resetToFirstPage(): void {
    this.page.set(1);
  }

  clearFilters(): void {
    this.searchTerm.set(null);
    this.categoryId.set(null);
    this.sortBy.set('name');
    this.sortDirection.set('asc');
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
        this.searchTerm.set(term);
        this.resetToFirstPage();
      });
  }
}
