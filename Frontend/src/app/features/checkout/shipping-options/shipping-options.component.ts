import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormSectionComponent } from '../../../shared/ui/form-section/form-section.component';
import {
  FormRadioGroupComponent,
  type RadioOption,
} from '../../../shared/ui/form-radio-group/form-radio-group.component';

export interface ShippingOption extends RadioOption {
  readonly cost: number;
}

@Component({
  selector: 'app-shipping-options',
  imports: [ReactiveFormsModule, FormSectionComponent, FormRadioGroupComponent],
  templateUrl: './shipping-options.component.html',
  styleUrl: './shipping-options.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShippingOptionsComponent {
  form = input.required<FormGroup>();
  options = input.required<readonly ShippingOption[]>();
}
