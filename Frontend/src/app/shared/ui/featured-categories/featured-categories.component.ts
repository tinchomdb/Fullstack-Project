import { ChangeDetectionStrategy, Component, input, inject, computed } from '@angular/core';

import { Category } from '../../../core/models/category.model';
import {
  CategoryCardComponent,
  CardVariant,
  CARD_VARIANT,
} from './category-card/category-card.component';
import {
  BreakpointService,
  BreakpointSize,
  BREAKPOINT,
} from '../../../core/services/breakpoint.service';

const MAX_GRID_COLUMNS = 6;

@Component({
  selector: 'app-featured-categories',
  imports: [CategoryCardComponent],
  templateUrl: './featured-categories.component.html',
  styleUrl: './featured-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedCategoriesComponent {
  categories = input.required<readonly Category[]>();
  heading = input<string>('Shop by Category');
  displayHeading = input<boolean>(false);

  private readonly breakpointService = inject(BreakpointService);

  protected readonly cardVariants = computed(() => {
    const count = this.categories().length;
    const breakpoint = this.breakpointService.current();
    return this.getCardVariants(count, breakpoint);
  });

  protected readonly gridClass = computed(() => {
    const count = this.categories().length;
    return `grid-${Math.min(count, MAX_GRID_COLUMNS)}`;
  });

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
        variants[0] = CARD_VARIANT.HORIZONTAL;
      }
    } else if (count === 4) {
      if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
        variants[0] = CARD_VARIANT.HORIZONTAL;
        variants[1] = CARD_VARIANT.HORIZONTAL;
      }
    } else if (count === 5) {
      if (
        breakpoint === BREAKPOINT.MD ||
        breakpoint === BREAKPOINT.LG ||
        breakpoint === BREAKPOINT.XL
      ) {
        variants[0] = CARD_VARIANT.HORIZONTAL;
        variants[1] = CARD_VARIANT.HORIZONTAL;
        variants[4] = CARD_VARIANT.HORIZONTAL;
      }
    } else if (count >= 6) {
      if (breakpoint === BREAKPOINT.LG || breakpoint === BREAKPOINT.XL) {
        variants[0] = CARD_VARIANT.HORIZONTAL;
        variants[1] = CARD_VARIANT.HORIZONTAL;
      }
    }

    return variants;
  }
}
