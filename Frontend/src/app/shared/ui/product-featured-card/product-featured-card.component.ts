import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../../core/models/product.model';
import { ProductsService } from '../../../core/services/products.service';

@Component({
  selector: 'app-product-featured-card',
  imports: [CurrencyPipe, NgOptimizedImage, RouterLink],
  templateUrl: './product-featured-card.component.html',
  styleUrl: './product-featured-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFeaturedCardComponent {
  readonly products = input.required<Product[]>();

  private readonly productsService = inject(ProductsService);

  protected readonly gridClass = computed(() => {
    const count = this.products().length;
    if (count === 1) return 'grid-single';
    if (count === 2) return 'grid-dual';
    if (count === 3) return 'grid-triple';
    return 'grid-multi';
  });

  protected buildProductLink(product: Product): string {
    return this.productsService.buildProductUrl(product);
  }
}
