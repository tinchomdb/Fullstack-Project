import { Signal, WritableSignal, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingOverlayService } from '../../core/services/loading-overlay.service';

export class Resource<T> {
  private readonly dataSignal: WritableSignal<T | null>;
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly data: Signal<T | null>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly hasData: Signal<boolean>;

  constructor(
    initialValue: T | null = null,
    private readonly loadingMessage = 'Loading...',
    private readonly loadingOverlayService?: LoadingOverlayService,
  ) {
    this.dataSignal = signal(initialValue);
    this.data = this.dataSignal.asReadonly();
    this.loading = this.loadingSignal.asReadonly();
    this.error = this.errorSignal.asReadonly();
    this.hasData = computed(() => this.data() !== null);
  }

  load(source$: Observable<T>): void {
    // Prevent duplicate loads while already loading
    if (this.loadingSignal()) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.loadingOverlayService?.show(this.loadingMessage);

    source$.subscribe({
      next: (value) => {
        this.dataSignal.set(value);
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
    this.dataSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
