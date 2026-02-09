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
import { ProductsService } from '../../../core/services/products.service';
import { AdminProductsFiltersService } from '../../../core/services/admin-products-filters.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { Product } from '../../../core/models/product.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { AdminItemCardComponent } from '../../../shared/ui/admin-item-card/admin-item-card.component';
import { ModalFormComponent } from '../../../shared/ui/modal-form/modal-form.component';
import { DropdownComponent } from '../../../shared/ui/dropdown/dropdown.component';
import { SearchComponent } from '../../../shared/ui/search/search.component';
import { LoadingIndicatorComponent } from '../../../shared/ui/loading-indicator/loading-indicator.component';
import { IntersectionObserverDirective } from '../../../shared/ui/intersection-observer.directive';
import {
  AdminProductFormComponent,
  AdminProductFormData,
} from './admin-product-form/admin-product-form.component';

@Component({
  selector: 'app-admin-products',
  imports: [
    ButtonComponent,
    AdminItemCardComponent,
    ModalFormComponent,
    DropdownComponent,
    SearchComponent,
    LoadingIndicatorComponent,
    IntersectionObserverDirective,
    AdminProductFormComponent,
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProductsComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly filtersService = inject(AdminProductsFiltersService);
  private readonly categoriesService = inject(CategoriesService);

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

  readonly categoryOptions = computed(() =>
    this.categories().map((cat) => ({ value: cat.id, label: cat.name })),
  );

  readonly categoryDropdownOptions = computed(() => [
    { value: '', label: 'All Categories' },
    ...this.categoryOptions(),
  ]);

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
  }

  private loadInitialProducts(): void {
    this.productsService.loadProducts(this.filtersService.apiParams());
  }

  openCreateForm(): void {
    this.editingProduct.set(null);
    this.showForm.set(true);
  }

  openEditForm(product: Product): void {
    this.editingProduct.set(product);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingProduct.set(null);
    this.formError.set(null);
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

  saveProduct(formData: AdminProductFormData): void {
    const productData: Partial<Product> = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      price: formData.price,
      stock: formData.stock,
      currency: formData.currency,
      categoryIds: formData.categoryId ? [formData.categoryId] : [],
      sellerId: formData.sellerId,
      imageUrls: formData.imageUrls,
      featured: formData.featured,
      seller: {
        id: formData.sellerId,
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
