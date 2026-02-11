import { computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingOverlayService } from '../../core/services/loading-overlay.service';

export class Resource<T> {
  readonly data;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasData;

  constructor(
    private readonly initialValue: T,
    private readonly loadingMessage = 'Loading...',
    private readonly loadingOverlayService?: LoadingOverlayService,
  ) {
    this.data = signal(initialValue);
    this.hasData = computed(() => {
      const value = this.data();
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value != null;
    });
  }

  load(source$: Observable<T>, clearData = true): void {
    if (this.loading()) {
      return;
    }

    if (clearData) {
      this.data.set(this.initialValue);
    }
    this.loading.set(true);
    this.error.set(null);
    this.loadingOverlayService?.show(this.loadingMessage);

    source$.subscribe({
      next: (value) => {
        this.data.set(value);
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
    this.data.set(this.initialValue);
    this.loading.set(false);
    this.error.set(null);
  }

  setLoading(isLoading: boolean): void {
    this.loading.set(isLoading);
  }
}
