import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Product } from '../../../models/product.model';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, CurrencyPipe, NgOptimizedImage],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
}
