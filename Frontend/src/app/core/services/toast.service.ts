import { Injectable, signal, computed } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly variant: ToastVariant;
  readonly duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly _toasts = signal<readonly Toast[]>([]);

  readonly toasts = computed(() => this._toasts());

  show(message: string, variant: ToastVariant = 'info', duration = 4000): void {
    const toast: Toast = {
      id: this.nextId++,
      message,
      variant,
      duration,
    };

    this._toasts.update((current) => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast.id), duration);
    }
  }

  success(message: string, duration = 4000): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 4000): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration = 4500): void {
    this.show(message, 'warning', duration);
  }

  dismiss(id: number): void {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
