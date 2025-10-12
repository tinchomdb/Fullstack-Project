import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

export type ArrowDirection = 'left' | 'right' | 'up' | 'down';

@Component({
  selector: 'app-navigation-arrow',
  templateUrl: './navigation-arrow.component.html',
  styleUrl: './navigation-arrow.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationArrowComponent {
  direction = input<ArrowDirection>('right');
  disabled = input(false);
  ariaLabel = input<string>();

  clicked = output<void>();

  protected handleClick(): void {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
