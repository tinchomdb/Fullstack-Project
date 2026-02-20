import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-success-icon',
  imports: [],
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
