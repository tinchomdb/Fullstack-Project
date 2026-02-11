import { computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingOverlayService } from '../../core/services/loading-overlay.service';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

export class InfiniteScrollResource<T> {
  readonly items = signal<T[]>([]);
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasData = computed(() => this.items().length > 0);
  readonly hasMore = computed(
    () => this.currentPage() < this.totalPages() && this.totalPages() > 0,
  );

  constructor(
    private readonly loadingMessage = 'Loading...',
    private readonly loadingOverlayService?: LoadingOverlayService,
  ) {}

  /**
   * Load initial data or reset and reload (e.g., when filters change)
   * Keeps previous items visible until new data arrives to prevent layout shifts
   */
  load(source$: Observable<PaginatedResponse<T>>): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.loadingOverlayService?.show(this.loadingMessage);

    source$.subscribe({
      next: (response) => {
        this.items.set(response.items);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.currentPage.set(response.page);
        this.loading.set(false);
        this.loadingOverlayService?.hide();
      },
      error: (err) => {
        this.error.set(err?.message ?? 'An unexpected error occurred.');
        this.loading.set(false);
        this.loadingOverlayService?.hide();
      },
    });
  }

  /**
   * Append more items to existing list (for infinite scroll)
   */
  loadMore(source$: Observable<PaginatedResponse<T>>): void {
    if (this.loadingMore() || this.loading() || !this.hasMore()) {
      return;
    }

    this.loadingMore.set(true);
    this.error.set(null);

    source$.subscribe({
      next: (response) => {
        const currentItems = this.items();
        this.items.set([...currentItems, ...response.items]);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.currentPage.set(response.page);
        this.loadingMore.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'An unexpected error occurred.');
        this.loadingMore.set(false);
      },
    });
  }

  reset(): void {
    this.items.set([]);
    this.totalCount.set(0);
    this.totalPages.set(0);
    this.currentPage.set(0);
    this.loading.set(false);
    this.loadingMore.set(false);
    this.error.set(null);
  }
}
