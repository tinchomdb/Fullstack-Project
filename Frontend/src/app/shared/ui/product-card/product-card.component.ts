import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { ProductsService } from '../../../core/services/products.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, CurrencyPipe, NgOptimizedImage, ButtonComponent, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();

  private readonly cartService = inject(CartService);
  private readonly productsService = inject(ProductsService);

  protected readonly isAddingToCart = this.cartService.loading;
  protected readonly productLink = computed(() => {
    const prod = this.product();
    return this.productsService.buildProductUrl(prod);
  });

  onAddToCart(): void {
    const product = this.product();
    if (!product) return;

    this.cartService.addToCart(product, 1);
  }
}
