import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryTreeNode } from '../../../../core/services/categories.service';
import { CategoryListItemComponent } from '../category-list-item/category-list-item.component';

@Component({
  selector: 'app-category-dropdown-menu',
  imports: [RouterLink, CategoryListItemComponent],
  templateUrl: './category-dropdown-menu.component.html',
  styleUrl: './category-dropdown-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDropdownMenuComponent {
  categoryTree = input.required<readonly CategoryTreeNode[]>();
  loading = input<boolean>(false);
  itemClick = output<void>();
}
