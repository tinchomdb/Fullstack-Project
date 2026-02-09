import { ChangeDetectionStrategy, Component, inject, input, output, computed } from '@angular/core';

import { Product } from '../../../core/models/product.model';
import { ProductFeaturedCardComponent } from './product-featured-card/product-featured-card.component';
import { BreakpointService } from '../../../core/services/breakpoint.service';
import { HeadingComponent } from '../heading/heading.component';
import { getProductCardVariants, CardVariant, CARD_VARIANT } from '../../utils/card-variants.utils';

const MAX_GRID_COLUMNS = 6;

@Component({
  selector: 'app-featured-products',
  imports: [ProductFeaturedCardComponent, HeadingComponent],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedProductsComponent {
  products = input.required<readonly Product[]>();
  heading = input<string>('Featured Products');
  displayHeading = input<boolean>(true);

  readonly addToCart = output<Product>();

  private readonly breakpointService = inject(BreakpointService);

  protected readonly cardVariants = computed(() => {
    const count = this.products().length;
    const breakpoint = this.breakpointService.current();
    return getProductCardVariants(count, breakpoint);
  });

  protected readonly gridClass = computed(() => {
    const count = this.products().length;
    return `grid-${Math.min(count, MAX_GRID_COLUMNS)}`;
  });

  protected onAddToCart(product: Product): void {
    this.addToCart.emit(product);
  }
}
