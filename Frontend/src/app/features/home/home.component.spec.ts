import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { HomeComponent } from './home.component';
import { ProductListManager, PRODUCT_LIST_CONFIG } from '../../core/managers/product-list.manager';
import { CategoriesService } from '../../core/services/categories.service';
import { CartService } from '../../core/services/cart.service';

import { CarouselService } from '../../core/services/carousel.service';
import { FiltersService } from '../../core/services/filters.service';
import { Category } from '../../core/models/category.model';
import { Product } from '../../core/models/product.model';
import { DEFAULT_SORT_OPTION, SORT_OPTIONS } from '../../core/models/sort-option.model';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let listManager: jasmine.SpyObj<ProductListManager>;
  let categoriesService: jasmine.SpyObj<CategoriesService>;

  const featuredCategoriesSignal = signal<Category[]>([]);

  const mockCategories: Category[] = Array.from({ length: 8 }, (_, i) => ({
    id: `cat-${i}`,
    name: `Category ${i}`,
    slug: `category-${i}`,
    featured: true,
    subcategoryIds: [],
    type: 'Category',
    url: `/category/category-${i}`,
  }));

  const mockProduct: Product = {
    id: 'p1',
    slug: 'product-1',
    name: 'Product 1',
    description: 'Desc',
    price: 10,
    currency: 'USD',
    sellerId: 's1',
    categoryIds: ['cat-1'],
    seller: { id: 's1', displayName: 'Seller', email: 's@e.com', companyName: null },
    imageUrls: [],
    createdAt: '',
    updatedAt: '',
    url: '/products/product-1',
  };

  beforeEach(() => {
    featuredCategoriesSignal.set(mockCategories);

    listManager = jasmine.createSpyObj('ProductListManager', ['loadMore'], {
      products: signal<Product[]>([mockProduct]),
      featuredProducts: signal<Product[]>([]),
      isLoadingMore: signal(false),
      hasMore: signal(true),
    });

    categoriesService = jasmine.createSpyObj('CategoriesService', ['loadCategories'], {
      featuredCategories: featuredCategoriesSignal,
    });

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: CategoriesService, useValue: categoriesService },
        {
          provide: CartService,
          useValue: {
            addToCart: jasmine.createSpy('addToCart').and.returnValue({ subscribe: () => {} }),
          },
        },

        {
          provide: CarouselService,
          useValue: {
            activeSlides: signal([]),
            activeSlidesLoading: signal(false),
            activeSlidesError: signal(null),
            loadActiveSlides: jasmine.createSpy('loadActiveSlides'),
          },
        },
        {
          provide: FiltersService,
          useValue: {
            currentSortOption: signal(DEFAULT_SORT_OPTION),
            setSortOption: jasmine.createSpy('setSortOption'),
          },
        },
      ],
    }).overrideComponent(HomeComponent, {
      set: {
        template: '',
        providers: [
          { provide: ProductListManager, useValue: listManager },
          { provide: PRODUCT_LIST_CONFIG, useValue: { loadFeatured: true, featuredLimit: 6 } },
        ],
      },
    });

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should slice featured categories to max 6', () => {
    const categories = (component as any).featuredCategories();
    expect(categories.length).toBe(6);
    expect(categories[0].id).toBe('cat-0');
    expect(categories[5].id).toBe('cat-5');
  });

  it('should return all categories when fewer than 6', () => {
    featuredCategoriesSignal.set(mockCategories.slice(0, 3));
    expect((component as any).featuredCategories().length).toBe(3);
  });

  it('should delegate loadMore to ProductListManager', () => {
    (component as any).onLoadMore();
    expect(listManager.loadMore).toHaveBeenCalled();
  });

  it('should expose products from list manager', () => {
    expect((component as any).products()).toEqual([mockProduct]);
  });
});
