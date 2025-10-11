import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { Product } from '../../../core/models/product.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-admin-products',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductsComponent {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly fb = inject(FormBuilder);

  readonly products = this.productsService.products;
  readonly categories = this.categoriesService.categories;
  readonly loading = this.productsService.loading;
  readonly error = this.productsService.error;

  readonly showForm = signal(false);
  readonly editingProduct = signal<Product | null>(null);
  readonly formError = signal<string | null>(null);

  readonly productForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    currency: ['USD', [Validators.required]],
    categoryId: ['', [Validators.required]],
    imageUrls: [''],
    featured: [false],
    sellerId: ['', [Validators.required]],
  });

  // Computed validation helpers
  protected readonly isFieldInvalid = (fieldName: string) =>
    computed(() => {
      const field = this.productForm.get(fieldName);
      return field ? field.invalid && field.touched : false;
    });

  openCreateForm(): void {
    this.editingProduct.set(null);
    this.productForm.reset({
      currency: 'USD',
      stock: 0,
      price: 0,
    });
    this.showForm.set(true);
  }

  openEditForm(product: Product): void {
    this.editingProduct.set(product);
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock ?? 0,
      currency: product.currency,
      categoryId: product.categoryId,
      imageUrls: product.imageUrls.join(', '),
      featured: product.featured ?? false,
      sellerId: product.sellerId,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
    this.formError.set(null);
    this.productForm.reset({
      currency: 'USD',
      stock: 0,
      price: 0,
    });
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      return;
    }

    const formValue = this.productForm.value;
    const imageUrls = formValue.imageUrls
      ? formValue.imageUrls
          .split(',')
          .map((url: string) => url.trim())
          .filter(Boolean)
      : [];

    const sellerId = formValue.sellerId ?? '';

    const productData: Partial<Product> = {
      name: formValue.name,
      description: formValue.description,
      price: formValue.price,
      stock: formValue.stock,
      currency: formValue.currency,
      categoryId: formValue.categoryId,
      sellerId,
      imageUrls,
      featured: formValue.featured ?? false,
      seller: {
        id: sellerId,
        displayName: '',
        email: '',
        companyName: null,
      },
    };

    const editing = this.editingProduct();
    if (editing) {
      const updatedProduct: Product = {
        ...editing,
        ...productData,
        id: editing.id,
        createdAt: editing.createdAt,
        updatedAt: new Date().toISOString(),
      } as Product;

      this.productsService.updateProduct(updatedProduct).subscribe({
        next: () => {
          this.closeForm();
          this.formError.set(null);
        },
        error: (err) => {
          const message = err?.message ?? 'Failed to update product';
          this.formError.set(message);
          console.error('Error updating product:', err);
        },
      });
    } else {
      const newProduct: Partial<Product> = {
        ...productData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.productsService.createProduct(newProduct).subscribe({
        next: () => {
          this.closeForm();
          this.formError.set(null);
        },
        error: (err) => {
          const message = err?.message ?? 'Failed to create product';
          this.formError.set(message);
          console.error('Error creating product:', err);
        },
      });
    }
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    this.productsService.deleteProduct(product.id, product.sellerId).subscribe({
      error: (err) => {
        const message = err?.message ?? 'Failed to delete product';
        alert(`Error: ${message}`);
        console.error('Error deleting product:', err);
      },
    });
  }
}
