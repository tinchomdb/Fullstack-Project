import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Category } from '../../../core/models/category.model';
import { CategoryCardComponent } from './category-card/category-card.component';

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
}
