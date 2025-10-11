import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-chevron-icon',
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
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChevronIconComponent {
  size = input<number>(16);
  strokeWidth = input<number>(2);
}
