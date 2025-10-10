import {
  Component,
  input,
  ChangeDetectionStrategy,
  TemplateRef,
  contentChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';

export interface RadioOption {
  value: string;
  label: string;
  subtitle?: string;
}

@Component({
  selector: 'app-form-radio-group',
  imports: [ReactiveFormsModule, NgTemplateOutlet],
  templateUrl: './form-radio-group.component.html',
  styleUrl: './form-radio-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormRadioGroupComponent<T extends RadioOption = RadioOption> {
  control = input.required<FormControl>();
  options = input.required<readonly T[]>();
  name = input.required<string>();

  // Optional custom template for complex option layouts
  customTemplate = contentChild<TemplateRef<{ $implicit: T }>>('optionTemplate');
}
