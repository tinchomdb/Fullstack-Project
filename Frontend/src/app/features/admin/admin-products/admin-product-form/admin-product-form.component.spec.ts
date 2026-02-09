import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { AdminProductFormComponent, AdminProductFormData } from './admin-product-form.component';
import { Product } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    subcategoryIds: [],
    type: 'Category',
    url: '/category/electronics',
  },
  {
    id: 'cat-2',
    name: 'Books',
    slug: 'books',
    subcategoryIds: [],
    type: 'Category',
    url: '/category/books',
  },
];

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
  url: '/products/test-product',
};

@Component({
  template: `<app-admin-product-form
    [editingProduct]="editingProduct()"
    [categories]="categories"
    [loading]="loading"
    [formError]="formError"
    (save)="lastSaveData = $event"
    (cancel)="cancelCalled = true"
  />`,
  imports: [AdminProductFormComponent],
})
class TestHostComponent {
  editingProduct = signal<Product | null>(null);
  categories: readonly Category[] = mockCategories;
  loading = false;
  formError: string | null = null;
  lastSaveData: AdminProductFormData | null = null;
  cancelCalled = false;
}

describe('AdminProductFormComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getComponent(): AdminProductFormComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getComponent()).toBeTruthy();
  });

  it('should have an empty form when no editing product', () => {
    const form = getComponent().productForm;
    expect(form.get('name')?.value).toBe('');
    expect(form.get('slug')?.value).toBe('');
  });

  it('should patch form when editing product is set', () => {
    host.editingProduct.set(mockProduct);
    fixture.detectChanges();
    TestBed.flushEffects();

    const form = getComponent().productForm;
    expect(form.get('name')?.value).toBe('Test Product');
    expect(form.get('slug')?.value).toBe('test-product');
    expect(form.get('price')?.value).toBe(29.99);
  });

  it('should set productImages when editing', () => {
    host.editingProduct.set(mockProduct);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(getComponent().productImages()).toEqual(['img1.jpg']);
  });

  it('should not submit when form is invalid', () => {
    getComponent().onSubmit();
    expect(host.lastSaveData).toBeNull();
  });

  it('should emit save with valid form data', () => {
    const comp = getComponent();
    comp.productForm.patchValue({
      name: 'New Product',
      slug: 'new-product',
      description: 'Description',
      price: 19.99,
      stock: 5,
      currency: 'USD',
      categoryId: 'cat-1',
      sellerId: 'seller-1',
    });
    comp.onSubmit();

    expect(host.lastSaveData).toBeTruthy();
    expect(host.lastSaveData!.name).toBe('New Product');
    expect(host.lastSaveData!.slug).toBe('new-product');
    expect(host.lastSaveData!.categoryId).toBe('cat-1');
  });

  it('should emit cancel', () => {
    getComponent().onCancel();
    expect(host.cancelCalled).toBeTrue();
  });

  it('should auto-generate slug from name when creating', () => {
    const comp = getComponent();
    comp.productForm.get('name')?.setValue('My Product Name');
    expect(comp.productForm.get('slug')?.value).toBe('my-product-name');
  });

  it('should manually generate slug', () => {
    const comp = getComponent();
    comp.productForm.patchValue({ name: 'Another Product' });
    comp.manuallyGenerateSlug();
    expect(comp.productForm.get('slug')?.value).toBe('another-product');
  });

  it('should update productImages on images change', () => {
    getComponent().onImagesChange(['a.jpg', 'b.jpg']);
    expect(getComponent().productImages()).toEqual(['a.jpg', 'b.jpg']);
  });

  it('should receive categories input', () => {
    expect(getComponent().categories()).toEqual(mockCategories);
  });
});
