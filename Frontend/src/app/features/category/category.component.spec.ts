import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CategoryComponent } from './category.component';
import { ProductListManager, PRODUCT_LIST_CONFIG } from '../../core/managers/product-list.manager';
import { CategoriesService } from '../../core/services/categories.service';
import { FiltersService } from '../../core/services/filters.service';
import { CartService } from '../../core/services/cart.service';

import { Category } from '../../core/models/category.model';
import { Product } from '../../core/models/product.model';
import { DEFAULT_SORT_OPTION } from '../../core/models/sort-option.model';

describe('CategoryComponent', () => {
  let component: CategoryComponent;
  let fixture: ComponentFixture<CategoryComponent>;
  let listManager: jasmine.SpyObj<ProductListManager>;
  let categoriesService: jasmine.SpyObj<CategoriesService>;
  let filtersService: jasmine.SpyObj<FiltersService>;

  const categoryIdSignal = signal<string | null>('cat-1');

  const testCategory: Category = {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    subcategoryIds: ['cat-2'],
    type: 'Category',
    featured: true,
    url: '/category/electronics',
  };

  const childCategory: Category = {
    id: 'cat-2',
    name: 'Phones',
    slug: 'phones',
    parentCategoryId: 'cat-1',
    subcategoryIds: [],
    type: 'Category',
    url: '/category/electronics/phones',
  };

  beforeEach(() => {
    categoryIdSignal.set('cat-1');

    listManager = jasmine.createSpyObj('ProductListManager', ['loadMore'], {
      products: signal<Product[]>([]),
      featuredProducts: signal<Product[]>([]),
      isLoadingInitial: signal(false),
      isLoadingMore: signal(false),
      hasMore: signal(true),
      error: signal<string | null>(null),
    });

    categoriesService = jasmine.createSpyObj(
      'CategoriesService',
      ['getCategoryById', 'getChildCategories'],
      {
        loading: signal(false),
        error: signal<string | null>(null),
      },
    );
    categoriesService.getCategoryById.and.returnValue(testCategory);
    categoriesService.getChildCategories.and.returnValue([childCategory]);

    filtersService = jasmine.createSpyObj('FiltersService', ['resetToFirstPage'], {
      categoryId: categoryIdSignal,
      currentSortOption: signal(DEFAULT_SORT_OPTION),
      setSortOption: jasmine.createSpy('setSortOption'),
    });

    TestBed.configureTestingModule({
      imports: [CategoryComponent],
      providers: [
        { provide: CategoriesService, useValue: categoriesService },
        { provide: FiltersService, useValue: filtersService },
        {
          provide: CartService,
          useValue: { addToCart: jasmine.createSpy('addToCart').and.returnValue({ subscribe: () => {} }) },
        },

      ],
    }).overrideComponent(CategoryComponent, {
      set: {
        template: '',
        providers: [
          { provide: ProductListManager, useValue: listManager },
          { provide: PRODUCT_LIST_CONFIG, useValue: { loadFeatured: true, featuredLimit: 6 } },
        ],
      },
    });

    fixture = TestBed.createComponent(CategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute activeCategory from filters + categories service', () => {
    expect((component as any).activeCategory()).toEqual(testCategory);
    expect(categoriesService.getCategoryById).toHaveBeenCalledWith('cat-1');
  });

  it('should return null activeCategory when no categoryId', () => {
    categoryIdSignal.set(null);
    expect((component as any).activeCategory()).toBeNull();
  });

  it('should compute combined loading state', () => {
    expect((component as any).loading()).toBe(false);
  });

  it('should compute combined error state', () => {
    expect((component as any).error()).toBeFalsy();
  });

  it('should compute subcategories from active category', () => {
    expect((component as any).subcategories()).toEqual([childCategory]);
    expect(categoriesService.getChildCategories).toHaveBeenCalledWith('cat-1');
  });

  it('should return empty subcategories when no active category', () => {
    categoryIdSignal.set(null);
    expect((component as any).subcategories()).toEqual([]);
  });

  it('should compute pageHeading from active category name', () => {
    expect((component as any).pageHeading()).toBe('Electronics');
  });

  it('should show default heading when no category', () => {
    categoryIdSignal.set(null);
    expect((component as any).pageHeading()).toBe('Category');
  });

  it('should delegate loadMore to list manager', () => {
    (component as any).onLoadMore();
    expect(listManager.loadMore).toHaveBeenCalled();
  });
});
