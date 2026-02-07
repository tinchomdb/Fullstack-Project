import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AdminCategoriesComponent } from './admin-categories.component';
import { CategoriesService, CategoryTreeNode } from '../../../core/services/categories.service';
import { Category } from '../../../core/models/category.model';

describe('AdminCategoriesComponent', () => {
  let component: AdminCategoriesComponent;
  let fixture: ComponentFixture<AdminCategoriesComponent>;
  let categoriesService: jasmine.SpyObj<CategoriesService>;

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Electronics',
      slug: 'electronics',
      description: 'Devices',
      featured: true,
      subcategoryIds: [],
      type: 'Category',
    },
  ];

  const mockTree: CategoryTreeNode[] = [{ category: mockCategories[0], children: [], level: 0 }];

  beforeEach(() => {
    categoriesService = jasmine.createSpyObj(
      'CategoriesService',
      [
        'createCategory',
        'updateCategory',
        'deleteCategory',
        'getAvailableParentCategories',
        'getParentCategoryName',
      ],
      {
        categories: signal(mockCategories),
        loading: signal(false),
        error: signal<string | null>(null),
        categoryTree: signal(mockTree),
      },
    );

    categoriesService.createCategory.and.returnValue(of(mockCategories[0]));
    categoriesService.updateCategory.and.returnValue(of(mockCategories[0]));
    categoriesService.deleteCategory.and.returnValue(of(undefined));
    categoriesService.getAvailableParentCategories.and.returnValue(mockCategories);
    categoriesService.getParentCategoryName.and.returnValue('None');

    TestBed.configureTestingModule({
      imports: [AdminCategoriesComponent, ReactiveFormsModule],
      providers: [{ provide: CategoriesService, useValue: categoriesService }],
    }).overrideComponent(AdminCategoriesComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(AdminCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form on init', () => {
    expect(component.categoryForm).toBeDefined();
    expect(component.categoryForm.get('name')).toBeTruthy();
    expect(component.categoryForm.get('slug')).toBeTruthy();
  });

  describe('openCreateForm', () => {
    it('should show form and reset editing', () => {
      component.openCreateForm();
      expect(component.showForm()).toBe(true);
      expect(component.editingCategory()).toBeNull();
    });
  });

  describe('openEditForm', () => {
    it('should populate form with category data', () => {
      component.openEditForm(mockCategories[0]);
      expect(component.showForm()).toBe(true);
      expect(component.editingCategory()).toEqual(mockCategories[0]);
      expect(component.categoryForm.get('name')?.value).toBe('Electronics');
      expect(component.categoryForm.get('slug')?.value).toBe('electronics');
    });
  });

  describe('closeForm', () => {
    it('should hide form and clear state', () => {
      component.openCreateForm();
      component.closeForm();
      expect(component.showForm()).toBe(false);
      expect(component.editingCategory()).toBeNull();
    });
  });

  describe('saveCategory', () => {
    it('should not save when form is invalid', () => {
      component.openCreateForm();
      component.saveCategory();
      expect(categoriesService.createCategory).not.toHaveBeenCalled();
    });

    it('should create new category with valid form', () => {
      component.openCreateForm();
      component.categoryForm.patchValue({
        name: 'Books',
        slug: 'books',
      });
      component.saveCategory();
      expect(categoriesService.createCategory).toHaveBeenCalled();
    });

    it('should update existing category', () => {
      component.openEditForm(mockCategories[0]);
      component.categoryForm.patchValue({ name: 'Updated' });
      component.saveCategory();
      expect(categoriesService.updateCategory).toHaveBeenCalled();
    });

    it('should close form after successful create', () => {
      component.openCreateForm();
      component.categoryForm.patchValue({ name: 'Books', slug: 'books' });
      component.saveCategory();
      expect(component.showForm()).toBe(false);
    });

    it('should handle create error', () => {
      spyOn(console, 'error');
      categoriesService.createCategory.and.returnValue(throwError(() => new Error('fail')));
      component.openCreateForm();
      component.categoryForm.patchValue({ name: 'Books', slug: 'books' });
      component.saveCategory();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('should delete after confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.deleteCategory(mockCategories[0]);
      expect(categoriesService.deleteCategory).toHaveBeenCalledWith('cat-1');
    });

    it('should not delete when user cancels', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteCategory(mockCategories[0]);
      expect(categoriesService.deleteCategory).not.toHaveBeenCalled();
    });
  });

  describe('manuallyGenerateSlug', () => {
    it('should generate slug from name', () => {
      component.categoryForm.patchValue({ name: 'My Category' });
      component.manuallyGenerateSlug();
      expect(component.categoryForm.get('slug')?.value).toBe('my-category');
    });
  });

  describe('helper methods', () => {
    it('should get available parent categories', () => {
      const result = component.getAvailableParentCategories();
      expect(categoriesService.getAvailableParentCategories).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });

    it('should get parent category name', () => {
      const result = component.getParentCategoryName('cat-1');
      expect(categoriesService.getParentCategoryName).toHaveBeenCalledWith('cat-1');
      expect(result).toBe('None');
    });
  });
});
