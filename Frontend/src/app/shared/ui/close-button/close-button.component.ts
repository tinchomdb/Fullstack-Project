import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

export type CloseButtonVariant = 'default' | 'minimal';
export type CloseButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-close-button',
  templateUrl: './close-button.component.html',
  styleUrl: './close-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloseButtonComponent {
  variant = input<CloseButtonVariant>('default');
  size = input<CloseButtonSize>('md');
  ariaLabel = input('Close');

  clicked = output<void>();

  protected handleClick(): void {
    this.clicked.emit();
  }
}
