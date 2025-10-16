import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CategoryTreeNode } from '../../../../core/services/categories.service';
import { CloseButtonComponent } from '../../close-button/close-button.component';
import { ThemeToggleComponent } from '../../theme-toggle/theme-toggle.component';
import { CategoryTreeItemComponent } from '../category-tree-item/category-tree-item.component';
import { AuthButtonComponent } from '../../auth-button/auth-button.component';

@Component({
  selector: 'app-menu-sidebar-panel',
  imports: [
    RouterLink,
    CloseButtonComponent,
    ThemeToggleComponent,
    CategoryTreeItemComponent,
    AuthButtonComponent,
  ],
  templateUrl: './menu-sidebar-panel.component.html',
  styleUrl: './menu-sidebar-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSidebarPanelComponent {
  categoryTree = input.required<readonly CategoryTreeNode[]>();
  loading = input<boolean>(false);
  isLoggedIn = input<boolean>(false);
  isAdmin = input<boolean>(false);

  itemClick = output<void>();
  logoutClick = output<void>();

  protected readonly expandedCategories = signal(new Set<string>());

  protected toggleCategory(categoryId: string): void {
    this.expandedCategories.update((expanded) => {
      const updated = new Set(expanded);
      updated.has(categoryId) ? updated.delete(categoryId) : updated.add(categoryId);
      return updated;
    });
  }
}
