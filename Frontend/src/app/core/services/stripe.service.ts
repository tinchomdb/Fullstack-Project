import { Injectable, signal, inject } from '@angular/core';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';
import { Observable, from, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PaymentApiService } from './payment-api.service';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private readonly paymentApi = inject(PaymentApiService);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private paymentElement: StripePaymentElement | null = null;

  readonly isReady = signal(false);
  readonly isFormComplete = signal(false);
  readonly isInitializing = signal(false);
  readonly isMounted = signal(false);
  readonly clientSecret = signal<string | null>(null);

  private readonly elementId = 'payment-element';

  async initialize(clientSecret: string): Promise<void> {
    if (this.isInitializing()) {
      throw new Error('Stripe already initializing');
    }

    this.isInitializing.set(true);

    try {
      this.clientSecret.set(clientSecret);

      if (!this.stripe) {
        this.stripe = await loadStripe(environment.stripePublishableKey);
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

  initializePayment(amount: number, email: string): Observable<void> {
    return this.paymentApi
      .createPaymentIntent({ amount, email })
      .pipe(switchMap((response) => from(this.initialize(response.clientSecret))));
  }

  mountPaymentElement(): void {
    if (!this.elements) {
      throw new Error('Stripe elements not initialized');
    }

    this.paymentElement = this.elements.create('payment');
    this.paymentElement.mount(`#${this.elementId}`);
    this.isMounted.set(true);

    // Listen to changes in the payment element
    this.paymentElement.on('change', (event) => {
      this.isFormComplete.set(event.complete);
    });
  }

  unmountPaymentElement(): void {
    if (this.paymentElement) {
      this.paymentElement.unmount();
      this.paymentElement = null;
      this.isFormComplete.set(false);
      this.isMounted.set(false);
    }
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

  reset(): void {
    this.unmountPaymentElement();
    this.elements = null;
    this.clientSecret.set(null);
    this.isReady.set(false);
    this.isInitializing.set(false);
  }
}
