import { inject, Injectable, signal, computed, effect, untracked } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import {
  Observable,
  catchError,
  throwError,
  finalize,
  combineLatest,
  map,
  startWith,
  switchMap,
  from,
  tap,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { CartService } from './cart.service';
import { StripeService } from './stripe.service';
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
const DEFAULT_COUNTRY = 'United States';

const PHONE_PATTERN = /^\+?[\d\s\-\(\)]+$/;
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly cartService = inject(CartService);
  readonly stripeService = inject(StripeService);
  private readonly fb = inject(FormBuilder);

  readonly cart = this.cartService.cart;
  readonly isEmpty = this.cartService.isEmpty;

  readonly isProcessing = signal(false);
  readonly error = signal<string | null>(null);

  readonly shippingOptions = SHIPPING_OPTIONS;

  readonly shippingForm = this.createShippingForm();
  readonly shippingOptionForm = this.createShippingOptionForm();

  private readonly forms = [this.shippingForm, this.shippingOptionForm];

  private readonly emailValue = toSignal(
    this.shippingForm.get('email')!.valueChanges.pipe(startWith('')),
  );

  constructor() {
    // Auto-initialize payment when email becomes valid
    effect(() => {
      const email = this.emailValue();
      const emailControl = this.shippingForm.get('email');

      if (email && emailControl?.valid) {
        untracked(() => {
          const total = this.totalWithShipping();
          const hasSecret = this.stripeService.clientSecret();
          const isInitializing = this.stripeService.isInitializing();

          if (total > 0 && !hasSecret && !isInitializing) {
            this.initializePayment().subscribe({
              error: (err) => console.error('Payment initialization failed:', err),
            });
          }
        });
      }
    });
  }

  readonly isFormValid = toSignal(
    combineLatest(this.forms.map((form) => form.statusChanges.pipe(startWith(form.status)))).pipe(
      map((statuses) => statuses.every((status) => status === 'VALID')),
    ),
  );

  readonly canSubmit = computed(() => {
    const formsValid = this.isFormValid() ?? false;
    const stripeReady = this.stripeService.isReady();
    const stripeFormComplete = this.stripeService.isFormComplete();
    const hasClientSecret = !!this.stripeService.clientSecret();
    const notProcessing = !this.isProcessing();

    return formsValid && stripeReady && stripeFormComplete && hasClientSecret && notProcessing;
  });

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

  initializePayment(): Observable<void> {
    const email = this.shippingForm.value.email ?? '';
    const amount = Math.round(this.totalWithShipping() * 100); // Convert to cents

    this.error.set(null);

    return this.stripeService.initializePayment(amount, email).pipe(
      catchError((error) => {
        console.error('Payment initialization error:', error);
        this.error.set('Failed to initialize payment. Please try again.');
        return throwError(() => error);
      }),
    );
  }

  submitCheckout(returnUrl: string): Observable<Order> {
    if (!this.isFormValid() || this.isProcessing() || !this.stripeService.isReady()) {
      this.markAllFormsAsTouched();
      return throwError(() => new Error('Form validation failed'));
    }

    return from(this.stripeService.confirmPayment(returnUrl)).pipe(
      tap(() => console.log('Stripe payment confirmed successfully')),
      switchMap(() => this.processCheckout(this.buildCheckoutRequest())),
      catchError((error) => {
        console.error('Stripe payment failed:', error);
        this.error.set('Payment failed. Please try again.');
        return throwError(() => error);
      }),
    );
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
      paymentMethod: 'stripe',
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
}
