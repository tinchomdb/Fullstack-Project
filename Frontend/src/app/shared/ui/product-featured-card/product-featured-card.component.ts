import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-featured-card',
  imports: [CommonModule, CurrencyPipe, NgOptimizedImage, RouterLink],
  templateUrl: './product-featured-card.component.html',
  styleUrl: './product-featured-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFeaturedCardComponent {
  readonly product = input.required<Product>();

  protected readonly productLink = computed(() => {
    const prod = this.product();
    return ['/products', prod.id];
  });
  protected readonly productQueryParams = computed(() => {
    const prod = this.product();
    return { sellerId: prod.sellerId };
  });
}
