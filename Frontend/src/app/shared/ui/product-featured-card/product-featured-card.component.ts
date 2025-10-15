import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { ProductsService } from '../../../core/services/products.service';
import { BadgeComponent } from '../badge/badge.component';
import { ButtonComponent } from '../button/button.component';
import { HeadingComponent } from '../heading/heading.component';

@Component({
  selector: 'app-product-featured-card',
  imports: [
    CurrencyPipe,
    NgOptimizedImage,
    RouterLink,
    HeadingComponent,
    ButtonComponent,
    BadgeComponent,
  ],
  templateUrl: './product-featured-card.component.html',
  styleUrl: './product-featured-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFeaturedCardComponent {
  readonly products = input.required<Product[]>();

  private readonly cartService = inject(CartService);
  private readonly productsService = inject(ProductsService);

  private readonly addingProductId = signal<string | null>(null);

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

  protected isAddingToCart(productId: string): boolean {
    return this.addingProductId() === productId && this.cartService.loading();
  }

  onAddToCart(product: Product): void {
    if (!product || this.addingProductId()) return;

    this.addingProductId.set(product.id);
    this.cartService.addToCart(product, 1);

    setTimeout(() => {
      this.addingProductId.set(null);
    }, 1000);
  }
}
