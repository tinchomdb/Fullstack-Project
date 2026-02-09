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

import { CartService, type ValidateCheckoutResponse } from './cart.service';
import { StripeService } from './stripe.service';
import { OrderStateService } from './order-state.service';
import { AuthService } from '../auth/auth.service';
import { Order } from '../models/order.model';
import { OrderStatus } from '../models/order-status.model';
import { COUNTRIES } from '../../shared/constants/countries';

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
// Supports international postal codes: US (12345 or 12345-6789), Canada (A1A 1A1),
// UK (SW1A 1AA), and most other country formats
const ZIP_PATTERN = /^[A-Z0-9\s\-]{2,}$/i;

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly cartService = inject(CartService);
  private readonly stripeService = inject(StripeService);
  private readonly orderState = inject(OrderStateService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly cart = this.cartService.cart;
  readonly cartIsEmpty = this.cartService.isEmpty;
  readonly cartUserId = this.cartService.cartUserId;

  private readonly _isProcessing = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly isProcessing = this._isProcessing.asReadonly();
  readonly error = this._error.asReadonly();

  readonly shippingOptions = SHIPPING_OPTIONS;
  readonly countries = COUNTRIES;

  readonly shippingForm = this.createShippingForm();
  readonly shippingOptionForm = this.createShippingOptionForm();

  private readonly forms = [this.shippingForm, this.shippingOptionForm];

  // Stripe state exposed for template binding
  readonly stripeClientSecret = this.stripeService.clientSecret;
  readonly stripeIsInitializing = this.stripeService.isInitializing;

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
    const cart = this.cart();
    const cartId = cart?.id ?? '';
    const shippingCost = this.selectedShippingCost() ?? 0;

    this._error.set(null);

    return this.stripeService.initializePayment(amount, email, cartId, shippingCost).pipe(
      catchError((error) => {
        console.error('Payment initialization error:', error);
        this._error.set('Failed to initialize payment. Please try again.');
        return throwError(() => error);
      }),
    );
  }

  validateCart(): Observable<ValidateCheckoutResponse> {
    this._error.set(null);
    return this.cartService.validateCheckout().pipe(
      tap((response) => {
        if (!response.isValid && response.warnings?.length) {
          this._error.set(`Cart issues: ${response.warnings.join(', ')}`);
        }
      }),
      catchError((error) => {
        console.error('Cart validation error:', error);
        this._error.set('Failed to validate cart. Please try again.');
        return throwError(() => error);
      }),
    );
  }

  submitCheckout(returnUrl: string): Observable<Order> {
    if (!this.isFormValid() || this.isProcessing() || !this.stripeService.isReady()) {
      this.markAllFormsAsTouched();
      return throwError(() => new Error('Form validation failed'));
    }

    this._isProcessing.set(true);
    this._error.set(null);

    const cart = this.cart();
    const email = this.shippingForm.value.email ?? '';
    const cartUserId = this.cartUserId();
    const userId = cartUserId ?? this.authService.userId();
    const shippingCost = this.selectedShippingCost() ?? 0;

    if (!cart || !userId) {
      this._error.set('Payment details missing. Please try again.');
      this._isProcessing.set(false);
      return throwError(() => new Error('Payment details missing'));
    }

    return from(this.stripeService.confirmPayment(returnUrl)).pipe(
      switchMap(() =>
        this.stripeService.completePayment(
          cart.id,
          email,
          Math.round(this.totalWithShipping() * 100),
        ),
      ),
      tap(() => {
        this.cartService.loadCart();
      }),
      map(() => {
        // Return a dummy order object - the real order was created by the webhook
        // TODO: The component will redirect to order success page and fetch the real order there
        const dummyOrder: Order = {
          id: '123456789',
          userId,
          orderDate: new Date().toISOString(),
          status: OrderStatus.Pending,
          items: [],
          subtotal: cart.subtotal,
          shippingCost,
          total: this.totalWithShipping(),
          currency: 'USD',
        };
        // Store the order in OrderStateService so the success page can access it
        this.orderState.setLastOrder(dummyOrder);
        return dummyOrder;
      }),
      catchError((error) => {
        console.error('Payment failed:', error);
        this._error.set('Payment processing failed. Please try again.');
        return throwError(() => error);
      }),
      finalize(() => this._isProcessing.set(false)),
    );
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
      state: ['', [Validators.minLength(2)]],
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
