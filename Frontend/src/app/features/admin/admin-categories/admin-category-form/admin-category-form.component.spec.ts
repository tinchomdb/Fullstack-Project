import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import {
  AdminCategoryFormComponent,
  AdminCategoryFormData,
} from './admin-category-form.component';
import { Category } from '../../../../core/models/category.model';

const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Electronics', slug: 'electronics', subcategoryIds: [], type: 'Category', url: '/category/electronics' },
];

const mockCategory: Category = {
  id: 'cat-1',
  name: 'Electronics',
  slug: 'electronics',
  description: 'Devices',
  featured: true,
  subcategoryIds: [],
  type: 'Category',
  url: '/category/electronics',
};

@Component({
  template: `<app-admin-category-form
    [editingCategory]="editingCategory()"
    [availableParentCategories]="parentCategories"
    [loading]="loading"
    (save)="lastSaveData = $event"
    (cancel)="cancelCalled = true"
  />`,
  imports: [AdminCategoryFormComponent],
})
class TestHostComponent {
  editingCategory = signal<Category | null>(null);
  parentCategories: readonly Category[] = mockCategories;
  loading = false;
  lastSaveData: AdminCategoryFormData | null = null;
  cancelCalled = false;
}

describe('AdminCategoryFormComponent', () => {
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

  function getComponent(): AdminCategoryFormComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getComponent()).toBeTruthy();
  });

  it('should have an empty form when no editing category', () => {
    const form = getComponent().categoryForm;
    expect(form.get('name')?.value).toBe('');
    expect(form.get('slug')?.value).toBe('');
  });

  it('should patch form when editing category is set', () => {
    host.editingCategory.set(mockCategory);
    fixture.detectChanges();
    TestBed.flushEffects();

    const form = getComponent().categoryForm;
    expect(form.get('name')?.value).toBe('Electronics');
    expect(form.get('slug')?.value).toBe('electronics');
    expect(form.get('description')?.value).toBe('Devices');
  });

  it('should not submit when form is invalid', () => {
    getComponent().onSubmit();
    expect(host.lastSaveData).toBeNull();
  });

  it('should emit save with valid form data', () => {
    const comp = getComponent();
    comp.categoryForm.patchValue({
      name: 'Books',
      slug: 'books',
    });
    comp.onSubmit();

    expect(host.lastSaveData).toBeTruthy();
    expect(host.lastSaveData!.name).toBe('Books');
    expect(host.lastSaveData!.slug).toBe('books');
  });

  it('should emit cancel', () => {
    getComponent().onCancel();
    expect(host.cancelCalled).toBeTrue();
  });

  it('should auto-generate slug from name when creating', () => {
    const comp = getComponent();
    comp.categoryForm.get('name')?.setValue('My Category');
    expect(comp.categoryForm.get('slug')?.value).toBe('my-category');
  });

  it('should manually generate slug', () => {
    const comp = getComponent();
    comp.categoryForm.patchValue({ name: 'Another Category' });
    comp.manuallyGenerateSlug();
    expect(comp.categoryForm.get('slug')?.value).toBe('another-category');
  });

  it('should receive parent categories input', () => {
    expect(getComponent().availableParentCategories()).toEqual(mockCategories);
  });
});
