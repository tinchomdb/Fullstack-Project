import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { CategoriesService } from '../../../core/services/categories.service';
import { CategoryDropdownMenuComponent } from './category-dropdown-menu/category-dropdown-menu.component';
import { CategorySelectorButtonComponent } from './category-selector-button/category-selector-button.component';

@Component({
  selector: 'app-category-selector',
  imports: [CategorySelectorButtonComponent, CategoryDropdownMenuComponent],
  templateUrl: './category-selector.component.html',
  styleUrl: './category-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class CategorySelectorComponent {
  private readonly categoriesService = inject(CategoriesService);

  protected readonly isOpen = signal(false);
  protected readonly categoryTree = this.categoriesService.categoryTree;
  protected readonly loading = this.categoriesService.loading;

  toggleDropdown(): void {
    this.isOpen.update((open) => !open);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-category-selector')) {
      this.closeDropdown();
    }
  }
}
