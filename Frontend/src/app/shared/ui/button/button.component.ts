import { ChangeDetectionStrategy, Component, input } from '@angular/core';

type ButtonType = 'button' | 'submit' | 'reset';
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'full';
type ButtonShape = 'rounded' | 'pill';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-active]': 'active() || null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[style.pointer-events]': 'disabled() ? "none" : null',
  },
})
export class ButtonComponent {
  readonly type = input<ButtonType>('button');
  readonly disabled = input(false);
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly shape = input<ButtonShape>('pill');
  readonly active = input(false);
}
