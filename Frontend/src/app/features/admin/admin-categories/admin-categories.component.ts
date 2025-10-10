import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminCategoriesService } from '../../../core/services/admin-categories.service';
import { Category } from '../../../core/models/category.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoriesComponent implements OnInit {
  private readonly categoriesService = inject(AdminCategoriesService);
  private readonly fb = inject(FormBuilder);

  readonly categories = this.categoriesService.categories;
  readonly loading = this.categoriesService.loading;
  readonly error = this.categoriesService.error;
  readonly flattenedTree = this.categoriesService.flattenedTree;

  readonly showForm = signal(false);
  readonly editingCategory = signal<Category | null>(null);

  categoryForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.categoriesService.loadCategories();
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      description: [''],
      image: [''],
      featured: [false],
      parentCategoryId: [''],
    });
  }

  openCreateForm(): void {
    this.editingCategory.set(null);
    this.categoryForm.reset();
    this.showForm.set(true);
  }

  openEditForm(category: Category): void {
    this.editingCategory.set(category);
    this.categoryForm.patchValue({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      image: category.image ?? '',
      featured: category.featured ?? false,
      parentCategoryId: category.parentCategoryId ?? '',
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingCategory.set(null);
    this.categoryForm.reset();
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    const formValue = this.categoryForm.value;

    const categoryData: Partial<Category> = {
      name: formValue.name,
      slug: formValue.slug,
      description: formValue.description || undefined,
      image: formValue.image || undefined,
      featured: formValue.featured ?? false,
      parentCategoryId: formValue.parentCategoryId || undefined,
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

  generateSlug(): void {
    const name = this.categoryForm.get('name')?.value || '';
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    this.categoryForm.patchValue({ slug });
  }

  getAvailableParentCategories(): Category[] {
    return this.categoriesService.getAvailableParentCategories(this.editingCategory()?.id);
  }

  getParentCategoryName(parentId?: string): string {
    return this.categoriesService.getParentCategoryName(parentId);
  }
}
