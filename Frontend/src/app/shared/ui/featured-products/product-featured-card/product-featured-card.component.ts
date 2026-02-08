import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../../../core/models/product.model';
import { BadgeComponent } from '../../badge/badge.component';
import { ButtonComponent } from '../../button/button.component';

export const CARD_VARIANT = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
} as const;

export type CardVariant = (typeof CARD_VARIANT)[keyof typeof CARD_VARIANT];

@Component({
  selector: 'app-product-featured-card',
  imports: [CurrencyPipe, NgOptimizedImage, RouterLink, ButtonComponent, BadgeComponent],
  templateUrl: './product-featured-card.component.html',
  styleUrl: './product-featured-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.variant-vertical]': 'variant() === "vertical"',
    '[class.variant-horizontal]': 'variant() === "horizontal"',
  },
})
export class ProductFeaturedCardComponent {
  readonly product = input.required<Product>();
  readonly variant = input<CardVariant>(CARD_VARIANT.VERTICAL);
  readonly priority = input<boolean>(false);
  readonly index = input<number>(0);
  readonly productLink = input.required<string>();

  readonly addToCart = output<Product>();

  private readonly addingProductId = signal<string | null>(null);

  protected isAddingToCart(): boolean {
    return this.addingProductId() === this.product().id;
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.addingProductId()) return;

    this.addingProductId.set(this.product().id);
    this.addToCart.emit(this.product());

    setTimeout(() => {
      this.addingProductId.set(null);
    }, 1000);
  }
}
