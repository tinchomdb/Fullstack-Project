import { Injectable, signal, inject } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { Observable, from, switchMap, catchError, throwError, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PaymentApiService } from './payment-api.service';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private readonly paymentApi = inject(PaymentApiService);

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
   * In development, calls the test endpoint to simulate the webhook.
   * TODO: In production, the real Stripe webhook will handle order creation.
   */
  completePayment(cartId: string, email: string, amount: number): Observable<string> {
    const paymentIntentId = this.paymentIntentId();

    if (!paymentIntentId) {
      return throwError(() => new Error('Payment intent ID not available'));
    }

    return this.paymentApi
      .testCompletePayment({
        paymentIntentId,
        cartId,
        email,
        amount,
      })
      .pipe(
        map((response) => {
          if (!response.orderId) {
            throw new Error('Order ID not returned from payment');
          }
          return response.orderId;
        }),
        catchError((error) => {
          console.error('Test payment endpoint failed:', error);
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
