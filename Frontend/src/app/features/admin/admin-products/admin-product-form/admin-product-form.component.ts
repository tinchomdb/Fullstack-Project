import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  signal,
  effect,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { FormFieldComponent } from '../../../../shared/ui/form-field/form-field.component';
import { FormCheckboxComponent } from '../../../../shared/ui/form-checkbox/form-checkbox.component';
import { ImageGalleryManagerComponent } from '../../../../shared/ui/image-gallery-manager/image-gallery-manager.component';
import { generateSlug } from '../../../../shared/utils/form.utils';

export interface AdminProductFormData {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  currency: string;
  categoryId: string;
  sellerId: string;
  imageUrls: string[];
  featured: boolean;
}

@Component({
  selector: 'app-admin-product-form',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    FormFieldComponent,
    FormCheckboxComponent,
    ImageGalleryManagerComponent,
  ],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductFormComponent {
  private readonly fb = inject(FormBuilder);

  readonly editingProduct = input<Product | null>(null);
  readonly categories = input.required<readonly Category[]>();
  readonly loading = input(false);
  readonly formError = input<string | null>(null);

  readonly save = output<AdminProductFormData>();
  readonly cancel = output<void>();

  readonly productImages = signal<string[]>([]);

  readonly productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-z0-9-]+$/i)]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    currency: ['USD', [Validators.required]],
    categoryId: ['', [Validators.required]],
    imageUrls: [''],
    featured: [false],
    sellerId: ['', [Validators.required]],
  });

  constructor() {
    // Auto-generate slug from name when creating new product
    this.productForm.get('name')?.valueChanges.subscribe((name) => {
      if (!this.editingProduct()) {
        const slug = generateSlug(name || '');
        this.productForm.patchValue({ slug });
      }
    });

    // Patch form when editingProduct changes
    effect(() => {
      const product = this.editingProduct();
      if (product) {
        this.productImages.set([...product.imageUrls]);
        this.productForm.patchValue({
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          stock: product.stock ?? 0,
          currency: product.currency,
          categoryId: product.categoryIds.length > 0 ? product.categoryIds[0] : '',
          imageUrls: product.imageUrls.join(', '),
          featured: product.featured ?? false,
          sellerId: product.sellerId,
        });
      } else {
        this.productImages.set([]);
        this.productForm.reset({
          name: '',
          slug: '',
          description: '',
          currency: 'USD',
          stock: 0,
          price: 0,
          categoryId: '',
          imageUrls: '',
          featured: false,
          sellerId: '',
        });
      }
    });
  }

  protected control(name: string): FormControl {
    return this.productForm.get(name) as FormControl;
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    const formValue = this.productForm.value;
    const slug = (formValue.slug ?? '').trim().toLowerCase();

    this.save.emit({
      name: formValue.name ?? '',
      slug,
      description: formValue.description ?? '',
      price: formValue.price ?? 0,
      stock: formValue.stock ?? 0,
      currency: formValue.currency ?? 'USD',
      categoryId: formValue.categoryId ?? '',
      sellerId: formValue.sellerId ?? '',
      imageUrls: this.productImages(),
      featured: formValue.featured ?? false,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onImagesChange(images: string[]): void {
    this.productImages.set(images);
  }

  manuallyGenerateSlug(): void {
    const name = this.productForm.get('name')?.value || '';
    const slug = generateSlug(name);
    this.productForm.patchValue({ slug });
  }
}
