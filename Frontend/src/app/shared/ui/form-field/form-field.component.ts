import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent {
  control = input.required<FormControl>();
  label = input.required<string>();
  id = input.required<string>();
  type = input<string>('text');
  fullWidth = input<boolean>(false);
  errorMessage = input<string>('This field is required');

  get showError(): boolean {
    const ctrl = this.control();
    return ctrl.invalid && ctrl.touched;
  }

  get hasError(): boolean {
    return this.control().invalid && this.control().touched;
  }
}
