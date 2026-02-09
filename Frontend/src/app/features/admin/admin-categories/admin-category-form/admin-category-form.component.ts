import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  effect,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '../../../../core/models/category.model';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { FormFieldComponent } from '../../../../shared/ui/form-field/form-field.component';
import { FormCheckboxComponent } from '../../../../shared/ui/form-checkbox/form-checkbox.component';
import { generateSlug } from '../../../../shared/utils/form.utils';

export interface AdminCategoryFormData {
  name: string;
  slug: string;
  description: string;
  image: string;
  featured: boolean;
  parentCategoryId: string;
}

@Component({
  selector: 'app-admin-category-form',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    FormFieldComponent,
    FormCheckboxComponent,
  ],
  templateUrl: './admin-category-form.component.html',
  styleUrl: './admin-category-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoryFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly editingCategory = input<Category | null>(null);
  readonly availableParentCategories = input.required<readonly Category[]>();
  readonly loading = input(false);

  readonly save = output<AdminCategoryFormData>();
  readonly cancel = output<void>();

  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: [''],
    image: [''],
    featured: [false],
    parentCategoryId: [''],
  });

  constructor() {
    // Auto-generate slug from name when creating new category
    this.categoryForm.get('name')?.valueChanges.subscribe((name) => {
      if (!this.editingCategory()) {
        const slug = generateSlug(name || '');
        this.categoryForm.patchValue({ slug });
      }
    });

    // Patch form when editingCategory changes
    effect(() => {
      const category = this.editingCategory();
      if (category) {
        this.categoryForm.patchValue({
          name: category.name,
          slug: category.slug,
          description: category.description ?? '',
          image: category.image ?? '',
          featured: category.featured ?? false,
          parentCategoryId: category.parentCategoryId ?? '',
        });
      } else {
        this.categoryForm.reset({
          name: '',
          slug: '',
          description: '',
          image: '',
          featured: false,
          parentCategoryId: '',
        });
      }
    });
  }

  protected control(name: string): FormControl {
    return this.categoryForm.get(name) as FormControl;
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      return;
    }

    const formValue = this.categoryForm.value;

    this.save.emit({
      name: formValue.name ?? '',
      slug: formValue.slug ?? '',
      description: formValue.description ?? '',
      image: formValue.image ?? '',
      featured: formValue.featured ?? false,
      parentCategoryId: formValue.parentCategoryId ?? '',
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  manuallyGenerateSlug(): void {
    const name = this.categoryForm.get('name')?.value || '';
    const slug = generateSlug(name);
    this.categoryForm.patchValue({ slug });
  }
}
