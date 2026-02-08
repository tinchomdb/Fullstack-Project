import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';

import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { ProductsService } from '../../../core/services/products.service';
import { ProductCardComponent } from '../product-card/product-card.component';

@Component({
  selector: 'app-product-grid',
  imports: [ProductCardComponent],
  templateUrl: './product-grid.component.html',
  styleUrl: './product-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent {
  readonly products = input<readonly Product[]>([]);

  private readonly cartService = inject(CartService);
  private readonly productsService = inject(ProductsService);

  protected buildProductLink(product: Product): string {
    return this.productsService.buildProductUrl(product);
  }

  protected onAddToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }
}
