import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-arrow-icon',
  imports: [],
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArrowIconComponent {
  size = input<number>(16);
  strokeWidth = input<number>(2);
}
