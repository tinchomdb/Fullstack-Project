import { Component, inject, ChangeDetectionStrategy, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { ButtonComponent } from '../../shared/ui/button/button.component';
import { OrderStateService } from '../../core/services/order-state.service';

@Component({
  selector: 'app-order-success',
  imports: [CurrencyPipe, DatePipe, ButtonComponent],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSuccessComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly orderState = inject(OrderStateService);

  protected readonly order = this.orderState.order;
  protected readonly hasOrder = computed(() => !!this.order());

  ngOnInit(): void {
    // If no order exists, redirect to products page
    if (!this.order()) {
      console.warn('No order found, redirecting to products page');
      this.router.navigate(['/products']);
    }
  }

  continueShopping(): void {
    this.orderState.clearLastOrder();
    this.router.navigate(['/products']);
  }
}
