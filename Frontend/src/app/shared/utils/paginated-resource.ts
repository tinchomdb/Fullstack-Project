import { Signal, WritableSignal, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingOverlayService } from '../../core/services/loading-overlay.service';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

export class PaginatedResource<T> {
  private readonly responseSignal: WritableSignal<PaginatedResponse<T> | null>;
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly response: Signal<PaginatedResponse<T> | null>;
  readonly items: Signal<T[]>;
  readonly totalCount: Signal<number>;
  readonly totalPages: Signal<number>;
  readonly currentPage: Signal<number>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly hasData: Signal<boolean>;

  constructor(
    private readonly loadingMessage = 'Loading...',
    private readonly loadingOverlayService?: LoadingOverlayService,
  ) {
    this.responseSignal = signal(null);
    this.response = this.responseSignal.asReadonly();
    this.loading = this.loadingSignal.asReadonly();
    this.error = this.errorSignal.asReadonly();

    this.items = computed(() => this.response()?.items ?? []);
    this.totalCount = computed(() => this.response()?.totalCount ?? 0);
    this.totalPages = computed(() => this.response()?.totalPages ?? 0);
    this.currentPage = computed(() => this.response()?.page ?? 1);
    this.hasData = computed(() => this.items().length > 0);
  }

  load(source$: Observable<PaginatedResponse<T>>): void {
    if (this.loadingSignal()) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.loadingOverlayService?.show(this.loadingMessage);

    source$.subscribe({
      next: (value) => {
        this.responseSignal.set(value);
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

  reset(): void {
    this.responseSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
