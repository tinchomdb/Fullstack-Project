import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../../core/models/product.model';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, NgOptimizedImage, ButtonComponent, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly index = input<number>(0);
  readonly productLink = input.required<string>();

  readonly addToCart = output<Product>();

  private readonly addingProductId = signal<string | null>(null);

  protected isAddingToCart(): boolean {
    return this.addingProductId() === this.product().id;
  }

  onAddToCart(): void {
    const product = this.product();
    if (!product || this.addingProductId()) return;

    this.addingProductId.set(product.id);
    this.addToCart.emit(product);

    setTimeout(() => {
      this.addingProductId.set(null);
    }, 1000);
  }
}
