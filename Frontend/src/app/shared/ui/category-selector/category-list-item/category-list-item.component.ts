import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryTreeNode } from '../../../../core/services/categories.service';
import { ArrowIconComponent } from '../../icons/arrow-icon.component';

@Component({
  selector: 'app-category-list-item',
  imports: [RouterLink, ArrowIconComponent],
  templateUrl: './category-list-item.component.html',
  styleUrl: './category-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListItemComponent {
  node = input.required<CategoryTreeNode>();
  itemClick = output<void>();
}
