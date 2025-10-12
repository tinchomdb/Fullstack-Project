import { Component, input, output, ChangeDetectionStrategy, computed } from '@angular/core';

import { CategoryTreeNode } from '../../../../core/services/categories.service';
import { Category } from '../../../../core/models/category.model';
import { AdminItemCardComponent } from '../../../../shared/ui/admin-item-card/admin-item-card.component';
import { Badge } from '../../../../shared/ui/badge/badge.types';

@Component({
  selector: 'app-admin-category-tree-item',
  imports: [AdminItemCardComponent],
  templateUrl: './admin-category-tree-item.component.html',
  styleUrl: './admin-category-tree-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoryTreeItemComponent {
  node = input.required<CategoryTreeNode>();
  parentName = input<string>();

  edit = output<Category>();
  delete = output<Category>();

  badges = computed(() => {
    const badges: Badge[] = [];

    if (this.node().category.featured) {
      badges.push({ label: '⭐ Featured', variant: 'featured' });
    }

    if (this.node().level > 0) {
      badges.push({ label: `Level ${this.node().level}`, variant: 'warning' });
    } else {
      badges.push({ label: 'Root', variant: 'info' });
    }

    return badges;
  });

  metadata = computed(() => {
    const metadata: Array<{ label: string; value: string }> = [];

    if (this.parentName()) {
      metadata.push({ label: 'Parent', value: this.parentName()! });
    }

    if (this.node().children.length > 0) {
      metadata.push({ label: 'Subcategories', value: this.node().children.length.toString() });
    }

    return metadata;
  });
}
