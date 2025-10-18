import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-moon-icon',
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoonIconComponent {
  size = input<number>(20);
  strokeWidth = input<number>(2);
}
