import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-mastercard-icon',
  imports: [],
  template: `
    <svg
      [attr.width]="width()"
      [attr.height]="height()"
      viewBox="0 0 38 24"
      role="img"
      aria-label="Mastercard"
    >
      <rect width="38" height="24" rx="3" fill="#252525" />
      <circle cx="15" cy="12" r="7" fill="#EB001B" />
      <circle cx="23" cy="12" r="7" fill="#F79E1B" />
      <path d="M19 6.6a7 7 0 010 10.8 7 7 0 000-10.8z" fill="#FF5F00" />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MastercardIconComponent {
  width = input<number>(38);
  height = input<number>(24);
}
