import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-star-icon',
  imports: [],
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 20 20"
      [attr.fill]="fill()"
      aria-hidden="true"
    >
      <path
        d="M10 2L12.5 7.5L18.5 8.5L14.25 12.5L15.5 18.5L10 15.5L4.5 18.5L5.75 12.5L1.5 8.5L7.5 7.5L10 2Z"
      />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StarIconComponent {
  size = input<number>(20);
  fill = input<string>('currentColor');
}
