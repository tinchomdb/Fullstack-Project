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

  readonly isReady = signal(false);
  readonly isFormComplete = signal(false);
  readonly isInitializing = signal(false);
  readonly isMounted = signal(false);
  readonly clientSecret = signal<string | null>(null);
  readonly paymentIntentId = signal<string | null>(null);

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
          this.paymentIntentId.set(response.paymentIntentId);
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
    this.isMounted.set(true);

    this.paymentElement.on('change', (event) => {
      this.isFormComplete.set(event.complete);
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
      this.paymentElement.destroy();
      this.paymentElement = null;
      this.isFormComplete.set(false);
      this.isMounted.set(false);
    }
  }

  reset(): void {
    this.unmountPaymentElement();
    this.elements = null;
    this.clientSecret.set(null);
    this.paymentIntentId.set(null);
    this.isReady.set(false);
    this.isInitializing.set(false);
  }

  private async initialize(clientSecret: string): Promise<void> {
    if (this.isInitializing()) {
      throw new Error('Stripe already initializing');
    }

    this.isInitializing.set(true);

    try {
      this.clientSecret.set(clientSecret);

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
      this.isReady.set(true);
    } finally {
      this.isInitializing.set(false);
    }
  }
}
