import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import { StarIconComponent } from '../icons/star-icon.component';
import { CheckCircleIconComponent } from '../icons/check-circle-icon.component';
import { Cart } from '../../../core/models/cart.model';

@Component({
  selector: 'app-order-summary-panel',
  imports: [ButtonComponent, StarIconComponent, CheckCircleIconComponent],
  templateUrl: './order-summary-panel.component.html',
  styleUrl: './order-summary-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSummaryPanelComponent {
  // Inputs
  cart = input.required<Cart | null>();
  additionalCost = input<number>(0);
  additionalCostLabel = input<string>('');
  showItemDetails = input<boolean>(true);

  // CTA Configuration
  ctaLabel = input<string>('Proceed');
  ctaVariant = input<'primary' | 'secondary'>('primary');
  ctaDisabled = input<boolean>(false);
  showSecondaryCta = input<boolean>(false);
  secondaryCtaLabel = input<string>('');

  // Outputs
  ctaClick = output<void>();
  secondaryCtaClick = output<void>();

  // Computed values
  protected readonly itemCount = computed(() => {
    const cartData = this.cart();
    if (!cartData) return 0;
    return cartData.items.reduce((sum, item) => sum + item.quantity, 0);
  });

  protected readonly finalTotal = computed(() => {
    const cartData = this.cart();
    if (!cartData) return 0;
    return cartData.total + this.additionalCost();
  });

  onCtaClick(): void {
    if (!this.ctaDisabled()) {
      this.ctaClick.emit();
    }
  }

  onSecondaryCtaClick(): void {
    this.secondaryCtaClick.emit();
  }
}
