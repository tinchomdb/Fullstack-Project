import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-x-twitter-icon',
  imports: [],
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      [attr.fill]="fill()"
      aria-hidden="true"
    >
      <path
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XTwitterIconComponent {
  size = input<number>(20);
  fill = input<string>('currentColor');
}
