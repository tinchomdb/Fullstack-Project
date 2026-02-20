import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-visa-icon',
  imports: [],
  template: `
    <svg
      [attr.width]="width()"
      [attr.height]="height()"
      viewBox="0 0 38 24"
      role="img"
      aria-label="Visa"
    >
      <rect width="38" height="24" rx="3" fill="#1A1F71" />
      <text
        x="19"
        y="15.5"
        text-anchor="middle"
        fill="white"
        font-size="9"
        font-weight="bold"
        font-family="sans-serif"
      >
        VISA
      </text>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisaIconComponent {
  width = input<number>(38);
  height = input<number>(24);
}
