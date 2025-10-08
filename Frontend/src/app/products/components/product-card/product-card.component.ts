import { CommonModule, CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

import { Product } from '../../../models/product.model';
import { CartService } from '../../../cart/cart.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, CurrencyPipe, NgOptimizedImage, ButtonComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();

  private readonly cartService = inject(CartService);

  // Local loading state for this specific product
  protected readonly isAdding = signal(false);

  onAddToCart(): void {
    const product = this.product();
    if (!product || this.isAdding()) return;

    this.isAdding.set(true);

    this.cartService.addToCart(product, 1).subscribe({
      next: () => {
        // Successfully added to cart
        this.isAdding.set(false);
      },
      error: (error) => {
        console.error('Failed to add product to cart:', error);
        // TODO: Show error message to user
        this.isAdding.set(false);
      },
    });
  }
}
