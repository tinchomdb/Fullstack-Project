import { Signal, WritableSignal, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingOverlayService } from '../../core/services/loading-overlay.service';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

export class InfiniteScrollResource<T> {
  private readonly accumulatedItemsSignal: WritableSignal<T[]> = signal([]);
  private readonly totalCountSignal: WritableSignal<number> = signal(0);
  private readonly totalPagesSignal: WritableSignal<number> = signal(0);
  private readonly currentPageSignal: WritableSignal<number> = signal(0);
  private readonly loadingSignal = signal(false);
  private readonly loadingMoreSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly items: Signal<T[]> = this.accumulatedItemsSignal.asReadonly();
  readonly totalCount: Signal<number> = this.totalCountSignal.asReadonly();
  readonly totalPages: Signal<number> = this.totalPagesSignal.asReadonly();
  readonly currentPage: Signal<number> = this.currentPageSignal.asReadonly();
  readonly loading: Signal<boolean> = this.loadingSignal.asReadonly();
  readonly loadingMore: Signal<boolean> = this.loadingMoreSignal.asReadonly();
  readonly error: Signal<string | null> = this.errorSignal.asReadonly();
  readonly hasData: Signal<boolean> = computed(() => this.items().length > 0);
  readonly hasMore: Signal<boolean> = computed(
    () => this.currentPage() < this.totalPages() && this.totalPages() > 0,
  );

  constructor(
    private readonly loadingMessage = 'Loading...',
    private readonly loadingOverlayService?: LoadingOverlayService,
  ) {}

  /**
   * Load initial data or reset and reload (e.g., when filters change)
   * Immediately clears accumulated items to prevent flashing old data
   */
  load(source$: Observable<PaginatedResponse<T>>): void {
    if (this.loadingSignal()) {
      return;
    }

    this.accumulatedItemsSignal.set([]);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.loadingOverlayService?.show(this.loadingMessage);

    source$.subscribe({
      next: (response) => {
        // Reset accumulated items and load fresh
        this.accumulatedItemsSignal.set(response.items);
        this.totalCountSignal.set(response.totalCount);
        this.totalPagesSignal.set(response.totalPages);
        this.currentPageSignal.set(response.page);
        this.loadingSignal.set(false);
        this.loadingOverlayService?.hide();
      },
      error: (err) => {
        this.errorSignal.set(err?.message ?? 'An unexpected error occurred.');
        this.loadingSignal.set(false);
        this.loadingOverlayService?.hide();
      },
    });
  }

  /**
   * Append more items to existing list (for infinite scroll)
   */
  loadMore(source$: Observable<PaginatedResponse<T>>): void {
    // Guards to prevent duplicate requests
    if (this.loadingMoreSignal() || this.loadingSignal() || !this.hasMore()) {
      return;
    }

    this.loadingMoreSignal.set(true);
    this.errorSignal.set(null);

    source$.subscribe({
      next: (response) => {
        const currentItems = this.accumulatedItemsSignal();
        this.accumulatedItemsSignal.set([...currentItems, ...response.items]);
        this.totalCountSignal.set(response.totalCount);
        this.totalPagesSignal.set(response.totalPages);
        this.currentPageSignal.set(response.page);
        this.loadingMoreSignal.set(false);
      },
      error: (err) => {
        this.errorSignal.set(err?.message ?? 'An unexpected error occurred.');
        this.loadingMoreSignal.set(false);
      },
    });
  }

  reset(): void {
    this.accumulatedItemsSignal.set([]);
    this.totalCountSignal.set(0);
    this.totalPagesSignal.set(0);
    this.currentPageSignal.set(0);
    this.loadingSignal.set(false);
    this.loadingMoreSignal.set(false);
    this.errorSignal.set(null);
  }
}
