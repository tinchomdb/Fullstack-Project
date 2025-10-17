import { inject, Injectable, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, catchError, throwError, finalize, combineLatest, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { CartService } from './cart.service';
import { Order } from '../models/order.model';

export interface CheckoutRequest {
  shippingCost: number;
  shippingDetails: ShippingDetails;
  paymentMethod: string;
}

export interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ShippingOption {
  readonly value: string;
  readonly label: string;
  readonly cost: number;
}

const SHIPPING_OPTIONS: readonly ShippingOption[] = [
  { value: 'standard', label: 'Standard Shipping (5-7 days)', cost: 5.99 },
  { value: 'express', label: 'Express Shipping (2-3 days)', cost: 12.99 },
  { value: 'overnight', label: 'Overnight Shipping', cost: 24.99 },
] as const;

const DEFAULT_SHIPPING = 'standard';
const DEFAULT_PAYMENT = 'credit-card';
const DEFAULT_COUNTRY = 'United States';

const PHONE_PATTERN = /^\+?[\d\s\-\(\)]+$/;
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly cartService = inject(CartService);
  private readonly fb = inject(FormBuilder);

  readonly cart = this.cartService.cart;
  readonly isEmpty = this.cartService.isEmpty;

  readonly isProcessing = signal(false);
  readonly error = signal<string | null>(null);

  readonly shippingOptions = SHIPPING_OPTIONS;

  readonly shippingForm = this.createShippingForm();
  readonly shippingOptionForm = this.createShippingOptionForm();
  readonly paymentForm = this.createPaymentForm();

  private readonly forms = [this.shippingForm, this.shippingOptionForm, this.paymentForm];

  readonly isFormValid = toSignal(
    combineLatest(this.forms.map((form) => form.statusChanges.pipe(startWith(form.status)))).pipe(
      map((statuses) => statuses.every((status) => status === 'VALID')),
    ),
  );

  readonly selectedShippingCost = toSignal(
    (this.shippingOptionForm.get('shippingOption') as FormControl).valueChanges.pipe(
      startWith(this.shippingOptionForm.value.shippingOption),
      map((value) => this.getShippingCost(value)),
    ),
  );

  readonly totalWithShipping = computed(() => {
    const cart = this.cart();
    return (cart?.total ?? 0) + (this.selectedShippingCost() ?? 0);
  });

  submitCheckout(): Observable<Order> {
    if (!this.isFormValid() || this.isProcessing()) {
      this.markAllFormsAsTouched();
      return throwError(() => new Error('Form validation failed'));
    }

    return this.processCheckout(this.buildCheckoutRequest());
  }

  private processCheckout(request: CheckoutRequest): Observable<Order> {
    this.isProcessing.set(true);
    this.error.set(null);

    return this.cartService.checkout(request.shippingCost).pipe(
      catchError((error) => {
        this.error.set('Checkout failed. Please try again.');
        return throwError(() => error);
      }),
      finalize(() => this.isProcessing.set(false)),
    );
  }

  private buildCheckoutRequest(): CheckoutRequest {
    return {
      shippingCost: this.selectedShippingCost() ?? 0,
      shippingDetails: this.shippingForm.getRawValue(),
      paymentMethod: this.paymentForm.value.method ?? DEFAULT_PAYMENT,
    };
  }

  private getShippingCost(optionValue: string): number {
    return SHIPPING_OPTIONS.find((option) => option.value === optionValue)?.cost ?? 0;
  }

  private markAllFormsAsTouched(): void {
    this.forms.forEach((form) => form.markAllAsTouched());
  }

  private createShippingForm(): FormGroup {
    return this.fb.nonNullable.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      state: ['', [Validators.required, Validators.minLength(2)]],
      zipCode: ['', [Validators.required, Validators.pattern(ZIP_PATTERN)]],
      country: [DEFAULT_COUNTRY, [Validators.required]],
    });
  }

  private createShippingOptionForm(): FormGroup {
    return this.fb.nonNullable.group({
      shippingOption: [DEFAULT_SHIPPING, [Validators.required]],
    });
  }

  private createPaymentForm(): FormGroup {
    return this.fb.nonNullable.group({
      method: [DEFAULT_PAYMENT, [Validators.required]],
    });
  }
}
