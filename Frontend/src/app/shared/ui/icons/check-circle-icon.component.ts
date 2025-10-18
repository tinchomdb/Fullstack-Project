import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-check-circle-icon',
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
        d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM9 14L5 10L6.41 8.59L9 11.17L13.59 6.58L15 8L9 14Z"
      />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckCircleIconComponent {
  size = input<number>(20);
  fill = input<string>('currentColor');
}
