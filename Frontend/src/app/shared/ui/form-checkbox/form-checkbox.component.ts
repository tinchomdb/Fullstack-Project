import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-checkbox',
  imports: [ReactiveFormsModule],
  templateUrl: './form-checkbox.component.html',
  styleUrl: './form-checkbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormCheckboxComponent {
  control = input.required<FormControl>();
  label = input.required<string>();
  id = input.required<string>();
  subtitle = input<string>('');
}
