import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormSectionComponent } from '../../../shared/ui/form-section/form-section.component';
import { StripePaymentFormComponent } from '../stripe-payment-form/stripe-payment-form.component';
import { CheckoutService } from '../../../core/services/checkout.service';

@Component({
  selector: 'app-payment-method',
  imports: [FormSectionComponent, StripePaymentFormComponent],
  templateUrl: './payment-method.component.html',
  styleUrl: './payment-method.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodComponent {
  protected readonly checkout = inject(CheckoutService);
}
