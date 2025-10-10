import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormSectionComponent } from '../../../shared/ui/form-section/form-section.component';
import {
  FormRadioGroupComponent,
  type RadioOption,
} from '../../../shared/ui/form-radio-group/form-radio-group.component';

@Component({
  selector: 'app-payment-method',
  imports: [ReactiveFormsModule, FormSectionComponent, FormRadioGroupComponent],
  templateUrl: './payment-method.component.html',
  styleUrl: './payment-method.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodComponent {
  form = input.required<FormGroup>();

  protected readonly paymentOptions: readonly RadioOption[] = [
    { value: 'credit-card', label: 'Credit Card (Demo)' },
    { value: 'paypal', label: 'PayPal (Demo)' },
  ];
}
