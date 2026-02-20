import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-alert-circle-icon',
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
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertCircleIconComponent {
  size = input<number>(24);
  strokeWidth = input<number>(2);
}
