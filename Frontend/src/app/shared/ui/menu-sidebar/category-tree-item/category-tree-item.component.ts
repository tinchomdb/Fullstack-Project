import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryTreeNode, CategoriesService } from '../../../../core/services/categories.service';
import { ChevronIconComponent } from '../../icons/chevron-icon.component';

@Component({
  selector: 'app-category-tree-item',
  imports: [RouterLink, ChevronIconComponent],
  templateUrl: './category-tree-item.component.html',
  styleUrl: './category-tree-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-root]': 'isRootLevel()',
  },
})
export class CategoryTreeItemComponent {
  node = input.required<CategoryTreeNode>();
  level = input<number>(0);
  expandedCategories = input.required<Set<string>>();

  toggleCategory = output<string>();
  categoryClick = output<void>();

  private readonly categoriesService = inject(CategoriesService);

  // Core computed values
  protected readonly category = computed(() => this.node().category);
  protected readonly hasChildren = computed(() => this.node().children?.length > 0);
  protected readonly isRootLevel = computed(() => this.level() === 0);
  protected readonly isExpanded = computed(() => this.expandedCategories().has(this.category().id));

  // Derived values for template
  protected readonly categoryName = computed(() => this.category().name);
  protected readonly categoryUrl = computed(() =>
    this.categoriesService.buildCategoryUrl(this.category().id),
  );
}
