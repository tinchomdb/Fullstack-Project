import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-delivery-icon',
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
      <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryIconComponent {
  size = input<number>(20);
  strokeWidth = input<number>(2);
}
