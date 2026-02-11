import { computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingOverlayService } from '../../core/services/loading-overlay.service';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

export class PaginatedResource<T> {
  readonly response = signal<PaginatedResponse<T> | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly items = computed(() => this.response()?.items ?? []);
  readonly totalCount = computed(() => this.response()?.totalCount ?? 0);
  readonly totalPages = computed(() => this.response()?.totalPages ?? 0);
  readonly currentPage = computed(() => this.response()?.page ?? 1);
  readonly hasData = computed(() => this.items().length > 0);

  constructor(
    private readonly loadingMessage = 'Loading...',
    private readonly loadingOverlayService?: LoadingOverlayService,
  ) {}

  load(source$: Observable<PaginatedResponse<T>>): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.loadingOverlayService?.show(this.loadingMessage);

    source$.subscribe({
      next: (value) => {
        this.response.set(value);
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

  reset(): void {
    this.response.set(null);
    this.loading.set(false);
    this.error.set(null);
  }
}
