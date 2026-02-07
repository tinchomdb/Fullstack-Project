import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/models/category.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { AdminCategoryTreeItemComponent } from './admin-category-tree-item/admin-category-tree-item.component';
import { FormCheckboxComponent } from '../../../shared/ui/form-checkbox/form-checkbox.component';
import { FormFieldComponent } from '../../../shared/ui/form-field/form-field.component';
import { ModalFormComponent } from '../../../shared/ui/modal-form/modal-form.component';
import { generateSlug } from '../../../shared/utils/form.utils';

@Component({
  selector: 'app-admin-categories',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    AdminCategoryTreeItemComponent,
    FormCheckboxComponent,
    FormFieldComponent,
    ModalFormComponent,
  ],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoriesComponent implements OnInit {
  private readonly categoriesService = inject(CategoriesService);
  private readonly fb = inject(FormBuilder);

  readonly categories = this.categoriesService.categories;
  readonly loading = this.categoriesService.loading;
  readonly error = this.categoriesService.error;
  readonly categoryTree = this.categoriesService.categoryTree;

  readonly showForm = signal(false);
  readonly editingCategory = signal<Category | null>(null);

  categoryForm!: FormGroup;

  protected control(name: string): FormControl {
    return this.categoryForm.get(name) as FormControl;
  }

  ngOnInit(): void {
    this.initForm();
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

    // Auto-generate slug from name when creating new category
    this.categoryForm.get('name')?.valueChanges.subscribe((name) => {
      if (!this.editingCategory()) {
        const slug = generateSlug(name || '');
        this.categoryForm.patchValue({ slug });
      }
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

  manuallyGenerateSlug(): void {
    const name = this.categoryForm.get('name')?.value || '';
    const slug = generateSlug(name);
    this.categoryForm.patchValue({ slug });
  }

  getAvailableParentCategories(): Category[] {
    return this.categoriesService.getAvailableParentCategories(this.editingCategory()?.id);
  }

  getParentCategoryName(parentId?: string): string {
    return this.categoriesService.getParentCategoryName(parentId);
  }
}
