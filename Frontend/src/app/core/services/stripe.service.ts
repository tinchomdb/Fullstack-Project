import { Injectable, signal, inject } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { Observable, from, switchMap, catchError, throwError, map, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PaymentApiService } from './payment-api.service';
import { OrderApiService } from './order-api.service';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private readonly paymentApi = inject(PaymentApiService);
  private readonly orderApi = inject(OrderApiService);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;

  private readonly _isReady = signal(false);
  private readonly _isFormComplete = signal(false);
  private readonly _isInitializing = signal(false);
  private readonly _isMounted = signal(false);
  private readonly _clientSecret = signal<string | null>(null);
  private readonly _paymentIntentId = signal<string | null>(null);

  readonly isReady = this._isReady.asReadonly();
  readonly isFormComplete = this._isFormComplete.asReadonly();
  readonly isInitializing = this._isInitializing.asReadonly();
  readonly isMounted = this._isMounted.asReadonly();
  readonly clientSecret = this._clientSecret.asReadonly();
  readonly paymentIntentId = this._paymentIntentId.asReadonly();

  private readonly elementId = 'payment-element';

  initializePayment(
    amount: number,
    email: string,
    cartId: string,
    shippingCost: number,
  ): Observable<void> {
    return this.paymentApi.createPaymentIntent({ amount, email, cartId, shippingCost }).pipe(
      switchMap((response) => {
        if (response.paymentIntentId) {
          this._paymentIntentId.set(response.paymentIntentId);
        }
        return from(this.initialize(response.clientSecret));
      }),
    );
  }

  mountPaymentElement(): void {
    if (!this.elements) {
      throw new Error('Stripe elements not initialized');
    }

    this.paymentElement = this.elements.create('payment');
    this.paymentElement.mount(`#${this.elementId}`);
    this._isMounted.set(true);

    this.paymentElement.on('change', (event) => {
      this._isFormComplete.set(event.complete);
    });
  }

  async confirmPayment(returnUrl: string): Promise<void> {
    if (!this.stripe || !this.elements) {
      throw new Error('Stripe not initialized');
    }

    const result = await this.stripe.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      throw new Error(result.error.message ?? 'Payment failed');
    }
  }

  /**
   * Completes payment after Stripe confirmation.
   * Polls for the order created by the Stripe webhook.
   */
  completePayment(): Observable<string> {
    const paymentIntentId = this.paymentIntentId();

    if (!paymentIntentId) {
      return throwError(() => new Error('Payment intent ID not available'));
    }

    return this.pollForOrder(paymentIntentId);
  }

  private pollForOrder(
    paymentIntentId: string,
    maxAttempts = 15,
    intervalMs = 1500,
    attempt = 0,
  ): Observable<string> {
    if (attempt >= maxAttempts) {
      return throwError(
        () =>
          new Error(
            'Order confirmation timed out. Your payment was successful \u2014 your order will appear in your order history shortly.',
          ),
      );
    }

    const delay = attempt === 0 ? 0 : intervalMs;

    return timer(delay).pipe(
      switchMap(() => this.orderApi.getOrderByPaymentIntent(paymentIntentId)),
      map((order) => {
        if (!order.id) {
          throw new Error('Order ID not returned');
        }
        return order.id;
      }),
      catchError((error) => {
        if (error.status === 404) {
          return this.pollForOrder(paymentIntentId, maxAttempts, intervalMs, attempt + 1);
        }
        return throwError(() => error);
      }),
    );
  }

  unmountPaymentElement(): void {
    if (this.paymentElement) {
      this.paymentElement.unmount();
      this.paymentElement = null;
      this._isFormComplete.set(false);
      this._isMounted.set(false);
    }
  }

  reset(): void {
    this.unmountPaymentElement();
    this.elements = null;
    this._clientSecret.set(null);
    this._paymentIntentId.set(null);
    this._isReady.set(false);
    this._isInitializing.set(false);
  }

  private async initialize(clientSecret: string): Promise<void> {
    if (this.isInitializing()) {
      throw new Error('Stripe already initializing');
    }

    this._isInitializing.set(true);

    try {
      this._clientSecret.set(clientSecret);

      if (!this.stripe) {
        this.stripe = await loadStripe(environment.stripePublishableKey, {
          developerTools: {
            assistant: {
              enabled: false,
            },
          },
        });
      }

      if (!this.stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      this.elements = this.stripe.elements({ clientSecret });
      this._isReady.set(true);
    } finally {
      this._isInitializing.set(false);
    }
  }
}
