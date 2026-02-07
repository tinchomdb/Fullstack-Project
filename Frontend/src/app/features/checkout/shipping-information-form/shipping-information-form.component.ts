import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormFieldComponent } from '../../../shared/ui/form-field/form-field.component';
import { FormSectionComponent } from '../../../shared/ui/form-section/form-section.component';

@Component({
  selector: 'app-shipping-information-form',
  imports: [ReactiveFormsModule, FormFieldComponent, FormSectionComponent],
  templateUrl: './shipping-information-form.component.html',
  styleUrl: './shipping-information-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShippingInformationFormComponent {
  form = input.required<FormGroup>();
  countries = input.required<readonly { code: string; name: string }[]>();

  protected control(name: string): FormControl {
    return this.form().get(name) as FormControl;
  }
}
