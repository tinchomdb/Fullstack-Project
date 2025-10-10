import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CartService } from '../../core/services/cart.service';
import { CheckoutService } from '../../core/services/checkout.service';
import { DataStateComponent } from '../../shared/ui/data-state/data-state.component';
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
    ReactiveFormsModule,
    DataStateComponent,
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
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly isProcessing = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly cart = this.cartService.cart;
  protected readonly cartLoading = this.cartService.loading;
  protected readonly cartError = this.cartService.error;
  protected readonly isEmpty = this.cartService.isEmpty;

  protected readonly shippingForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-\(\)]+$/)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    city: ['', [Validators.required, Validators.minLength(2)]],
    state: ['', [Validators.required, Validators.minLength(2)]],
    zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
    country: ['United States', [Validators.required]],
  });

  protected readonly paymentForm = this.fb.nonNullable.group({
    method: ['credit-card', [Validators.required]],
  });

  protected readonly shippingOptions = [
    { value: 'standard', label: 'Standard Shipping (5-7 days)', cost: 5.99 },
    { value: 'express', label: 'Express Shipping (2-3 days)', cost: 12.99 },
    { value: 'overnight', label: 'Overnight Shipping', cost: 24.99 },
  ] as const;

  protected readonly shippingForm2 = this.fb.nonNullable.group({
    shippingOption: ['standard', [Validators.required]],
  });

  constructor() {
    // Redirect if cart is empty
    if (this.isEmpty()) {
      this.router.navigate(['/cart']);
    }
  }

  get selectedShippingCost(): number {
    const selectedOption = this.shippingForm2.value.shippingOption;
    return this.shippingOptions.find((option) => option.value === selectedOption)?.cost ?? 0;
  }

  get totalWithShipping(): number {
    const cart = this.cart();
    return (cart?.total ?? 0) + this.selectedShippingCost;
  }

  get isFormValid(): boolean {
    return this.shippingForm.valid && this.paymentForm.valid && this.shippingForm2.valid;
  }

  processCheckout(): void {
    if (!this.isFormValid || this.isProcessing()) {
      this.shippingForm.markAllAsTouched();
      return;
    }

    this.isProcessing.set(true);
    this.error.set(null);

    this.checkoutService
      .processCheckout({
        shippingCost: this.selectedShippingCost,
        shippingDetails: this.shippingForm.value as any,
        paymentMethod: this.paymentForm.value.method ?? 'credit-card',
      })
      .subscribe({
        next: (order) => {
          // Navigate to order confirmation
          this.router.navigate(['/orders', order.id]);
        },
        error: (error) => {
          console.error('Checkout failed:', error);
          this.error.set('Checkout failed. Please try again.');
          this.isProcessing.set(false);
        },
        complete: () => {
          this.isProcessing.set(false);
        },
      });
  }

  goBackToCart(): void {
    this.router.navigate(['/cart']);
  }
}
