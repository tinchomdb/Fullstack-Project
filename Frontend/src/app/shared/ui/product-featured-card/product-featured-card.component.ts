import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../../core/models/product.model';
import { ProductsService } from '../../../core/services/products.service';

@Component({
  selector: 'app-product-featured-card',
  imports: [CommonModule, CurrencyPipe, NgOptimizedImage, RouterLink],
  templateUrl: './product-featured-card.component.html',
  styleUrl: './product-featured-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFeaturedCardComponent {
  readonly product = input.required<Product>();

  private readonly productsService = inject(ProductsService);

  protected readonly productLink = computed(() => {
    const prod = this.product();
    return this.productsService.buildProductUrl(prod);
  });
}
