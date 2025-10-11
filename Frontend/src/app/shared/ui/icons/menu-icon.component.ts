import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-menu-icon',
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
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuIconComponent {
  size = input<number>(20);
  strokeWidth = input<number>(2);
}
