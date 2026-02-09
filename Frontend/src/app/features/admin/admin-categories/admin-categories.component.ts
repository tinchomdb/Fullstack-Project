import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/models/category.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { AdminCategoryTreeItemComponent } from './admin-category-tree-item/admin-category-tree-item.component';
import { ModalFormComponent } from '../../../shared/ui/modal-form/modal-form.component';
import {
  AdminCategoryFormComponent,
  AdminCategoryFormData,
} from './admin-category-form/admin-category-form.component';

@Component({
  selector: 'app-admin-categories',
  imports: [
    ButtonComponent,
    AdminCategoryTreeItemComponent,
    ModalFormComponent,
    AdminCategoryFormComponent,
  ],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoriesComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);

  readonly categories = this.categoriesService.categories;
  readonly loading = this.categoriesService.loading;
  readonly error = this.categoriesService.error;
  readonly categoryTree = this.categoriesService.categoryTree;

  readonly showForm = signal(false);
  readonly editingCategory = signal<Category | null>(null);

  ngOnInit(): void {
    // Categories are loaded by the service
  }

  openCreateForm(): void {
    this.editingCategory.set(null);
    this.showForm.set(true);
  }

  openEditForm(category: Category): void {
    this.editingCategory.set(category);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingCategory.set(null);
  }

  saveCategory(formData: AdminCategoryFormData): void {
    const categoryData: Partial<Category> = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || undefined,
      image: formData.image || undefined,
      featured: formData.featured,
      parentCategoryId: formData.parentCategoryId || undefined,
      subcategoryIds: [],
      type: 'Category',
    };

    const editing = this.editingCategory();
    if (editing) {
      const updatedCategory: Category = {
        ...editing,
        ...categoryData,
        id: editing.id,
      } as Category;

      this.categoriesService.updateCategory(updatedCategory).subscribe({
        next: () => this.closeForm(),
        error: (err) => console.error('Error updating category:', err),
      });
    } else {
      const newCategory: Partial<Category> = {
        ...categoryData,
        id: crypto.randomUUID(),
      };

      this.categoriesService.createCategory(newCategory).subscribe({
        next: () => this.closeForm(),
        error: (err) => console.error('Error creating category:', err),
      });
    }
  }

  deleteCategory(category: Category): void {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    this.categoriesService.deleteCategory(category.id).subscribe({
      error: (err) => console.error('Error deleting category:', err),
    });
  }

  getAvailableParentCategories(): Category[] {
    return this.categoriesService.getAvailableParentCategories(this.editingCategory()?.id);
  }

  getParentCategoryName(parentId?: string): string {
    return this.categoriesService.getParentCategoryName(parentId);
  }
}
