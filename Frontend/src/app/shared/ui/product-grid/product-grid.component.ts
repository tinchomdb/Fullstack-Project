import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Product } from '../../../core/models/product.model';
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

  readonly addToCart = output<Product>();

  protected onAddToCart(product: Product): void {
    this.addToCart.emit(product);
  }
}
