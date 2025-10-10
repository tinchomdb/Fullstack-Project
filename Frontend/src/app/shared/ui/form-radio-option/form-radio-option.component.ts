import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-form-radio-option',
  imports: [],
  templateUrl: './form-radio-option.component.html',
  styleUrl: './form-radio-option.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRadioOptionComponent {
  value = input.required<string>();
  name = input.required<string>();
  checked = input<boolean>(false);
}
