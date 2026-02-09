import { ChangeDetectionStrategy, Component, input, inject, computed } from '@angular/core';

import { Category } from '../../../core/models/category.model';
import {
  CategoryCardComponent,
} from './category-card/category-card.component';
import {
  BreakpointService,
} from '../../../core/services/breakpoint.service';
import { getCategoryCardVariants } from '../../utils/card-variants.utils';

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
    return getCategoryCardVariants(count, breakpoint);
  });

  protected readonly gridClass = computed(() => {
    const count = this.categories().length;
    return `grid-${Math.min(count, MAX_GRID_COLUMNS)}`;
  });
}
