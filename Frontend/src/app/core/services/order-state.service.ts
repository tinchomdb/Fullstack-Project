import { Injectable, signal } from '@angular/core';

import { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderStateService {
  private readonly lastOrder = signal<Order | null>(null);
  private clearTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly order = this.lastOrder.asReadonly();

  setLastOrder(order: Order): void {
    this.lastOrder.set(order);
    this.scheduleClear();
  }

  clearLastOrder(): void {
    this.lastOrder.set(null);
    this.cancelScheduledClear();
  }

  private scheduleClear(): void {
    this.cancelScheduledClear();
    // Auto-clear after 5 minutes
    this.clearTimeout = setTimeout(
      () => {
        this.lastOrder.set(null);
      },
      5 * 60 * 1000,
    );
  }

  private cancelScheduledClear(): void {
    if (this.clearTimeout) {
      clearTimeout(this.clearTimeout);
      this.clearTimeout = null;
    }
  }
}
