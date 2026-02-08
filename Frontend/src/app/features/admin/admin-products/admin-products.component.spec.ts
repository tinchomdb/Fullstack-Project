import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AdminProductsComponent } from './admin-products.component';
import { ProductsService } from '../../../core/services/products.service';
import { AdminProductsFiltersService } from '../../../core/services/admin-products-filters.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';

describe('AdminProductsComponent', () => {
  let component: AdminProductsComponent;
  let fixture: ComponentFixture<AdminProductsComponent>;
  let productsService: jasmine.SpyObj<ProductsService>;
  let filtersService: jasmine.SpyObj<AdminProductsFiltersService>;
  let categoriesService: jasmine.SpyObj<CategoriesService>;

  const loadingMoreSignal = signal(false);

  const mockProduct: Product = {
    id: 'p1',
    slug: 'test-product',
    name: 'Test Product',
    description: 'A product',
    price: 29.99,
    currency: 'USD',
    stock: 10,
    sellerId: 's1',
    categoryIds: ['cat-1'],
    seller: { id: 's1', displayName: 'Seller', email: 's@e.com', companyName: null },
    imageUrls: ['img1.jpg'],
    featured: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  const mockCategories: Category[] = [
    { id: 'cat-1', name: 'Electronics', slug: 'electronics', subcategoryIds: [], type: 'Category' },
    { id: 'cat-2', name: 'Books', slug: 'books', subcategoryIds: [], type: 'Category' },
  ];

  beforeEach(() => {
    loadingMoreSignal.set(false);

    productsService = jasmine.createSpyObj(
      'ProductsService',
      ['loadProducts', 'loadMoreProducts', 'createProduct', 'updateProduct', 'deleteProduct'],
      {
        products: signal<Product[]>([mockProduct]),
        loading: signal(false),
        loadingMore: loadingMoreSignal,
        hasMore: signal(true),
        error: signal<string | null>(null),
      },
    );
    productsService.createProduct.and.returnValue(of(mockProduct));
    productsService.updateProduct.and.returnValue(of(mockProduct));
    productsService.deleteProduct.and.returnValue(of(undefined));

    filtersService = jasmine.createSpyObj(
      'AdminProductsFiltersService',
      ['setSearchTerm', 'setCategoryId', 'loadNextPage', 'clearFilters', 'resetToFirstPage'],
      {
        categoryId: signal<string | null>(null),
        searchTerm: signal<string | null>(null),
        sortBy: signal('name' as const),
        sortDirection: signal('asc' as const),
        apiParams: signal({ page: 1, pageSize: 20, sortBy: 'name', sortDirection: 'asc' }),
      },
    );

    categoriesService = jasmine.createSpyObj('CategoriesService', ['loadCategories'], {
      categories: signal(mockCategories),
    });

    TestBed.configureTestingModule({
      imports: [AdminProductsComponent, ReactiveFormsModule],
      providers: [
        { provide: ProductsService, useValue: productsService },
        { provide: AdminProductsFiltersService, useValue: filtersService },
        { provide: CategoriesService, useValue: categoriesService },
      ],
    }).overrideComponent(AdminProductsComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(AdminProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(productsService.loadProducts).toHaveBeenCalled();
  });

  describe('computed signals', () => {
    it('should compute categoryOptions from categories', () => {
      const options = component.categoryOptions();
      expect(options).toEqual([
        { value: 'cat-1', label: 'Electronics' },
        { value: 'cat-2', label: 'Books' },
      ]);
    });

    it('should compute dropdown options with "All" prefix', () => {
      const options = component.categoryDropdownOptions();
      expect(options[0]).toEqual({ value: '', label: 'All Categories' });
      expect(options.length).toBe(3);
    });
  });

  describe('form operations', () => {
    it('should open create form with reset state', () => {
      component.openCreateForm();
      expect(component.showForm()).toBe(true);
      expect(component.editingProduct()).toBeNull();
      expect(component.productImages()).toEqual([]);
    });

    it('should open edit form with product data', () => {
      component.openEditForm(mockProduct);
      expect(component.showForm()).toBe(true);
      expect(component.editingProduct()).toEqual(mockProduct);
      expect(component.productImages()).toEqual(['img1.jpg']);
      expect(component.productForm.get('name')?.value).toBe('Test Product');
      expect(component.productForm.get('slug')?.value).toBe('test-product');
      expect(component.productForm.get('categoryId')?.value).toBe('cat-1');
    });

    it('should close form and reset state', () => {
      component.openCreateForm();
      component.closeForm();
      expect(component.showForm()).toBe(false);
      expect(component.editingProduct()).toBeNull();
      expect(component.formError()).toBeNull();
      expect(component.productImages()).toEqual([]);
    });
  });

  describe('saveProduct', () => {
    it('should not save when form is invalid', () => {
      component.openCreateForm();
      component.saveProduct();
      expect(productsService.createProduct).not.toHaveBeenCalled();
    });

    it('should create product with valid form', () => {
      component.openCreateForm();
      component.productForm.patchValue({
        name: 'New Product',
        slug: 'new-product',
        description: 'Description',
        price: 19.99,
        stock: 5,
        currency: 'USD',
        categoryId: 'cat-1',
        sellerId: 'seller-1',
      });
      component.saveProduct();
      expect(productsService.createProduct).toHaveBeenCalled();
    });

    it('should update product when editing', () => {
      component.openEditForm(mockProduct);
      component.productForm.patchValue({ name: 'Updated' });
      component.saveProduct();
      expect(productsService.updateProduct).toHaveBeenCalled();
    });

    it('should close form after successful save', () => {
      component.openCreateForm();
      component.productForm.patchValue({
        name: 'New',
        slug: 'new',
        description: 'D',
        price: 10,
        stock: 1,
        currency: 'USD',
        categoryId: 'cat-1',
        sellerId: 's1',
      });
      component.saveProduct();
      expect(component.showForm()).toBe(false);
    });

    it('should set formError on create failure', () => {
      spyOn(console, 'error');
      productsService.createProduct.and.returnValue(
        throwError(() => ({ message: 'Duplicate slug' })),
      );
      component.openCreateForm();
      component.productForm.patchValue({
        name: 'New',
        slug: 'new',
        description: 'D',
        price: 10,
        stock: 1,
        currency: 'USD',
        categoryId: 'cat-1',
        sellerId: 's1',
      });
      component.saveProduct();
      expect(component.formError()).toBe('Duplicate slug');
    });

    it('should set formError on update failure', () => {
      spyOn(console, 'error');
      productsService.updateProduct.and.returnValue(
        throwError(() => ({ message: 'Update failed' })),
      );
      component.openEditForm(mockProduct);
      component.saveProduct();
      expect(component.formError()).toBe('Update failed');
    });
  });

  describe('deleteProduct', () => {
    it('should delete after confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.deleteProduct(mockProduct);
      expect(productsService.deleteProduct).toHaveBeenCalledWith('p1', 's1');
    });

    it('should not delete when user cancels', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteProduct(mockProduct);
      expect(productsService.deleteProduct).not.toHaveBeenCalled();
    });

    it('should alert on delete error', () => {
      spyOn(console, 'error');
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      productsService.deleteProduct.and.returnValue(
        throwError(() => ({ message: 'Cannot delete' })),
      );
      component.deleteProduct(mockProduct);
      expect(window.alert).toHaveBeenCalledWith('Error: Cannot delete');
    });
  });

  describe('filters', () => {
    it('should delegate search change to filter service', () => {
      component.onSearchChange('laptop');
      expect(filtersService.setSearchTerm).toHaveBeenCalledWith('laptop');
    });

    it('should set null search for empty string', () => {
      component.onSearchChange('');
      expect(filtersService.setSearchTerm).toHaveBeenCalledWith(null);
    });

    it('should delegate category change', () => {
      component.onCategoryChange('cat-1');
      expect(filtersService.setCategoryId).toHaveBeenCalledWith('cat-1');
    });

    it('should clear filters', () => {
      component.clearFilters();
      expect(filtersService.clearFilters).toHaveBeenCalled();
    });
  });

  describe('onLoadMore', () => {
    it('should load more products', () => {
      component.onLoadMore();
      expect(filtersService.loadNextPage).toHaveBeenCalled();
      expect(productsService.loadMoreProducts).toHaveBeenCalled();
    });

    it('should not load more when already loading', () => {
      loadingMoreSignal.set(true);

      productsService.loadMoreProducts.calls.reset();
      filtersService.loadNextPage.calls.reset();

      component.onLoadMore();
      expect(filtersService.loadNextPage).not.toHaveBeenCalled();
    });
  });

  describe('onProductImagesChange', () => {
    it('should update productImages signal', () => {
      component.onProductImagesChange(['a.jpg', 'b.jpg']);
      expect(component.productImages()).toEqual(['a.jpg', 'b.jpg']);
    });
  });

  describe('manuallyGenerateSlug', () => {
    it('should generate slug from name field', () => {
      component.productForm.patchValue({ name: 'My Product Name' });
      component.manuallyGenerateSlug();
      expect(component.productForm.get('slug')?.value).toBe('my-product-name');
    });
  });
});
