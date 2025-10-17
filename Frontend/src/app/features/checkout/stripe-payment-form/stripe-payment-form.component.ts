import {
  Component,
  inject,
  ChangeDetectionStrategy,
  effect,
  afterNextRender,
  signal,
} from '@angular/core';
import { StripeService } from '../../../core/services/stripe.service';

@Component({
  selector: 'app-stripe-payment-form',
  imports: [],
  templateUrl: './stripe-payment-form.component.html',
  styleUrl: './stripe-payment-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StripePaymentFormComponent {
  protected readonly stripe = inject(StripeService);
  private readonly viewReady = signal(false);

  constructor() {
    // Set view ready flag after render
    afterNextRender(() => {
      this.viewReady.set(true);
    });

    // Mount the payment element when both the view is ready AND we have a client secret
    effect(() => {
      const clientSecret = this.stripe.clientSecret();
      const isMounted = this.stripe.isMounted();
      const viewReady = this.viewReady();

      if (viewReady && clientSecret && !isMounted) {
        this.stripe.mountPaymentElement();
      }
    });
  }

  ngOnDestroy(): void {
    this.stripe.unmountPaymentElement();
  }
}
