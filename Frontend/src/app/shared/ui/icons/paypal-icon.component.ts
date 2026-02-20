import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-paypal-icon',
  imports: [],
  template: `
    <svg
      [attr.width]="width()"
      [attr.height]="height()"
      viewBox="0 0 38 24"
      role="img"
      aria-label="PayPal"
    >
      <rect width="38" height="24" rx="3" fill="#253B80" />
      <text
        x="19"
        y="15.5"
        text-anchor="middle"
        fill="white"
        font-size="7"
        font-weight="bold"
        font-family="sans-serif"
      >
        PayPal
      </text>
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaypalIconComponent {
  width = input<number>(38);
  height = input<number>(24);
}
