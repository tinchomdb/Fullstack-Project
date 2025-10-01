import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type ButtonType = 'button' | 'submit' | 'reset';
type ButtonVariant = 'primary';
type ButtonSize = 'sm' | 'md';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
  },
})
export class ButtonComponent {
  readonly type = input<ButtonType>('button');
  readonly disabled = input(false);
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
}
