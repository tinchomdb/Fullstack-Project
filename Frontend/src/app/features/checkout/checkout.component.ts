import { Component, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CheckoutService } from '../../core/services/checkout.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { OrderSummaryPanelComponent } from '../../shared/ui/order-summary-panel/order-summary-panel.component';
import { SidebarLayoutComponent } from '../../shared/layouts/sidebar-layout/sidebar-layout.component';
import { ShippingInformationFormComponent } from './shipping-information-form/shipping-information-form.component';
import { ShippingOptionsComponent } from './shipping-options/shipping-options.component';
import { PaymentMethodComponent } from './payment-method/payment-method.component';

@Component({
  selector: 'app-checkout',
  imports: [
    CommonModule,
    ButtonComponent,
    OrderSummaryPanelComponent,
    SidebarLayoutComponent,
    ShippingInformationFormComponent,
    ShippingOptionsComponent,
    PaymentMethodComponent,
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent {
  private readonly router = inject(Router);

  protected readonly checkout = inject(CheckoutService);

  constructor() {
    effect(() => {
      if (this.checkout.isEmpty()) {
        this.router.navigate(['/']);
      }
    });
  }

  processCheckout(): void {
    const returnUrl = `${window.location.origin}/checkout`;

    this.checkout.submitCheckout(returnUrl).subscribe({
      next: (order) => {
        this.router.navigate(['/orders', order.id]);
      },
    });
  }

  goBackToCart(): void {
    this.router.navigate(['/cart']);
  }
}
