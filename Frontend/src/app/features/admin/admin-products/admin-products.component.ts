import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductsService } from '../../../core/services/products.service';
import { AdminProductsFiltersService } from '../../../core/services/admin-products-filters.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { Product } from '../../../core/models/product.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { FormFieldComponent } from '../../../shared/ui/form-field/form-field.component';
import { FormCheckboxComponent } from '../../../shared/ui/form-checkbox/form-checkbox.component';
import { AdminItemCardComponent } from '../../../shared/ui/admin-item-card/admin-item-card.component';
import { ModalFormComponent } from '../../../shared/ui/modal-form/modal-form.component';
import { DropdownComponent } from '../../../shared/ui/dropdown/dropdown.component';
import { SearchComponent } from '../../../shared/ui/search/search.component';
import { LoadingIndicatorComponent } from '../../../shared/ui/loading-indicator/loading-indicator.component';
import { ImageGalleryManagerComponent } from '../../../shared/ui/image-gallery-manager/image-gallery-manager.component';
import { generateSlug } from '../../../shared/utils/form.utils';
import { IntersectionObserverDirective } from '../../../shared/ui/intersection-observer.directive';

@Component({
  selector: 'app-admin-products',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    FormFieldComponent,
    FormCheckboxComponent,
    AdminItemCardComponent,
    ModalFormComponent,
    DropdownComponent,
    SearchComponent,
    LoadingIndicatorComponent,
    ImageGalleryManagerComponent,
    IntersectionObserverDirective,
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductsComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly filtersService = inject(AdminProductsFiltersService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly fb = inject(FormBuilder);

  // Expose filters service for template
  protected readonly filters = this.filtersService;

  readonly products = this.productsService.products;
  readonly categories = this.categoriesService.categories;
  readonly loading = this.productsService.loading;
  readonly loadingMore = this.productsService.loadingMore;
  readonly hasMore = this.productsService.hasMore;
  readonly error = this.productsService.error;

  readonly showForm = signal(false);
  readonly editingProduct = signal<Product | null>(null);
  readonly formError = signal<string | null>(null);
  readonly productImages = signal<string[]>([]);

  readonly categoryOptions = computed(() =>
    this.categories().map((cat) => ({ value: cat.id, label: cat.name })),
  );

  readonly categoryDropdownOptions = computed(() => [
    { value: '', label: 'All Categories' },
    ...this.categoryOptions(),
  ]);

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

  // Computed validation helpers
  protected readonly isFieldInvalid = (fieldName: string) =>
    computed(() => {
      const field = this.productForm.get(fieldName);
      return field ? field.invalid && field.touched : false;
    });

  protected control(name: string): FormControl {
    return this.productForm.get(name) as FormControl;
  }

  constructor() {
    let isFirstRun = true;
    effect(() => {
      this.filtersService.categoryId();
      this.filtersService.searchTerm();
      this.filtersService.sortBy();
      this.filtersService.sortDirection();

      if (isFirstRun) {
        isFirstRun = false;
        return;
      }

      untracked(() => this.reloadProducts());
    });
  }

  ngOnInit(): void {
    this.loadInitialProducts();
    this.initFormSubscriptions();
  }

  private loadInitialProducts(): void {
    this.productsService.loadProducts(this.filtersService.apiParams());
  }

  private initFormSubscriptions(): void {
    // Auto-generate slug from name when creating new product
    this.productForm.get('name')?.valueChanges.subscribe((name) => {
      if (!this.editingProduct()) {
        const slug = generateSlug(name || '');
        this.productForm.patchValue({ slug });
      }
    });
  }

  openCreateForm(): void {
    this.editingProduct.set(null);
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
    this.showForm.set(true);
  }

  openEditForm(product: Product): void {
    this.editingProduct.set(product);
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
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
    this.formError.set(null);
    this.productImages.set([]);
    this.productForm.reset({
      currency: 'USD',
      stock: 0,
      price: 0,
    });
  }

  onSearchChange(term: string): void {
    this.filtersService.setSearchTerm(term || null);
  }

  onCategoryChange(categoryId: string): void {
    this.filtersService.setCategoryId(categoryId || null);
  }

  onLoadMore(): void {
    if (this.loadingMore() || !this.hasMore()) {
      return;
    }
    this.filtersService.loadNextPage();
    this.productsService.loadMoreProducts(this.filtersService.apiParams());
  }

  clearFilters(): void {
    this.filtersService.clearFilters();
    this.reloadProducts();
  }

  private reloadProducts(): void {
    this.filtersService.resetToFirstPage();
    this.loadInitialProducts();
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      return;
    }

    const formValue = this.productForm.value;
    const imageUrls = this.productImages();

    const sellerId = formValue.sellerId ?? '';
    const slug = (formValue.slug ?? '').trim().toLowerCase();

    const productData: Partial<Product> = {
      name: formValue.name,
      slug,
      description: formValue.description,
      price: formValue.price,
      stock: formValue.stock,
      currency: formValue.currency,
      categoryIds: formValue.categoryId ? [formValue.categoryId] : [],
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

  onProductImagesChange(images: string[]): void {
    this.productImages.set(images);
  }

  manuallyGenerateSlug(): void {
    const name = this.productForm.get('name')?.value || '';
    const slug = generateSlug(name);
    this.productForm.patchValue({ slug });
  }
}
