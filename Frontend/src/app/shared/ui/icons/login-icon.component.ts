import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-login-icon',
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
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
      <polyline points="10,17 15,12 10,7"></polyline>
      <line x1="15" y1="12" x2="3" y2="12"></line>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginIconComponent {
  size = input<number>(20);
  strokeWidth = input<number>(2);
}
