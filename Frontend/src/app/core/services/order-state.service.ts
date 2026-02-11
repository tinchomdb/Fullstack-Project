import { Injectable, signal } from '@angular/core';

import { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderStateService {
  readonly order = signal<Order | null>(null);

  private clearTimeoutId: ReturnType<typeof setTimeout> | null = null;

  setLastOrder(order: Order): void {
    this.order.set(order);
    this.scheduleClear();
  }

  clearLastOrder(): void {
    this.order.set(null);
    this.cancelScheduledClear();
  }

  private scheduleClear(): void {
    this.cancelScheduledClear();
    // Auto-clear after 5 minutes
    this.clearTimeoutId = setTimeout(
      () => {
        this.order.set(null);
      },
      5 * 60 * 1000,
    );
  }

  private cancelScheduledClear(): void {
    if (this.clearTimeoutId) {
      clearTimeout(this.clearTimeoutId);
      this.clearTimeoutId = null;
    }
  }
}
