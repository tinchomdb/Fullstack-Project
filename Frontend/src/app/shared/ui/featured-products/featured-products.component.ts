import { ChangeDetectionStrategy, Component, inject, input, computed } from '@angular/core';

import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import {
  ProductFeaturedCardComponent,
  CardVariant,
  CARD_VARIANT,
} from './product-featured-card/product-featured-card.component';
import {
  BreakpointService,
  BreakpointSize,
  BREAKPOINT,
} from '../../../core/services/breakpoint.service';
import { HeadingComponent } from '../heading/heading.component';

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

  private readonly breakpointService = inject(BreakpointService);
  private readonly cartService = inject(CartService);

  protected readonly cardVariants = computed(() => {
    const count = this.products().length;
    const breakpoint = this.breakpointService.current();
    return this.getCardVariants(count, breakpoint);
  });

  protected readonly gridClass = computed(() => {
    const count = this.products().length;
    return `grid-${Math.min(count, MAX_GRID_COLUMNS)}`;
  });

  protected onAddToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }

  private getCardVariants(count: number, breakpoint: BreakpointSize): CardVariant[] {
    const variants: CardVariant[] = new Array(count).fill(CARD_VARIANT.VERTICAL);

    if (breakpoint === BREAKPOINT.XS || breakpoint === BREAKPOINT.SM) {
      return variants;
    }

    if (count === 1) {
      if (
        breakpoint === BREAKPOINT.MD ||
        breakpoint === BREAKPOINT.LG ||
        breakpoint === BREAKPOINT.XL
      ) {
        variants[0] = CARD_VARIANT.HORIZONTAL;
      }
    } else if (count === 2) {
      if (
        breakpoint === BREAKPOINT.MD ||
        breakpoint === BREAKPOINT.LG ||
        breakpoint === BREAKPOINT.XL
      ) {
        variants[0] = CARD_VARIANT.HORIZONTAL;
        variants[1] = CARD_VARIANT.HORIZONTAL;
      }
    } else if (count === 3) {
      if (breakpoint === BREAKPOINT.MD) {
        variants[0] = CARD_VARIANT.HORIZONTAL;
      } else if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
        variants[1] = CARD_VARIANT.HORIZONTAL;
        variants[2] = CARD_VARIANT.HORIZONTAL;
      }
    } else if (count === 4) {
      if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
        variants[0] = CARD_VARIANT.HORIZONTAL;
        variants[1] = CARD_VARIANT.HORIZONTAL;
        variants[2] = CARD_VARIANT.HORIZONTAL;
        variants[3] = CARD_VARIANT.HORIZONTAL;
      }
    } else if (count === 5) {
      if (
        breakpoint === BREAKPOINT.MD ||
        breakpoint === BREAKPOINT.LG ||
        breakpoint === BREAKPOINT.XL
      ) {
        variants[0] = CARD_VARIANT.HORIZONTAL;
        variants[1] = CARD_VARIANT.HORIZONTAL;
        variants[2] = CARD_VARIANT.HORIZONTAL;
      }
    } else if (count >= 6) {
      if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
        variants[1] = CARD_VARIANT.HORIZONTAL;
        variants[2] = CARD_VARIANT.HORIZONTAL;
      }
    }

    return variants;
  }
}
