import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-featured-card',
  imports: [CommonModule, CurrencyPipe, NgOptimizedImage],
  templateUrl: './product-featured-card.component.html',
  styleUrl: './product-featured-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFeaturedCardComponent {
  readonly product = input.required<Product>();
}
