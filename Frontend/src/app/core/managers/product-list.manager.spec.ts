import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProductListManager, PRODUCT_LIST_CONFIG } from './product-list.manager';
import { ProductsService } from '../services/products.service';
import { FiltersService } from '../services/filters.service';

describe('ProductListManager', () => {
  let manager: ProductListManager;
  let productsServiceSpy: jasmine.SpyObj<ProductsService>;
  let filtersServiceSpy: jasmine.SpyObj<FiltersService>;

  beforeEach(() => {
    productsServiceSpy = jasmine.createSpyObj(
      'ProductsService',
      ['loadProducts', 'loadMoreProducts', 'loadFeaturedProducts'],
      {
        products: signal([]),
        loading: signal(false),
        loadingMore: signal(false),
        hasMore: signal(true),
        error: signal(null),
        currentPage: signal(1),
        totalCount: signal(0),
        featuredProducts: signal([]),
      },
    );

    filtersServiceSpy = jasmine.createSpyObj(
      'FiltersService',
      ['resetToFirstPage', 'loadNextPage', 'apiParams'],
      {
        categoryId: signal(null),
        minPrice: signal(null),
        maxPrice: signal(null),
        sortBy: signal('createdAt'),
        sortDirection: signal('desc'),
        searchTerm: signal(null),
      },
    );
    filtersServiceSpy.apiParams.and.returnValue({
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortDirection: 'desc',
    });

    TestBed.configureTestingModule({
      providers: [
        ProductListManager,
        { provide: ProductsService, useValue: productsServiceSpy },
        { provide: FiltersService, useValue: filtersServiceSpy },
        { provide: PRODUCT_LIST_CONFIG, useValue: { loadFeatured: false, featuredLimit: 6 } },
      ],
    });

    manager = TestBed.inject(ProductListManager);
  });

  it('should be created', () => {
    expect(manager).toBeTruthy();
  });

  it('should expose products from ProductsService', () => {
    expect(manager.products()).toEqual([]);
  });

  it('should expose loading states', () => {
    expect(manager.isLoadingInitial()).toBeFalse();
    expect(manager.isLoadingMore()).toBeFalse();
    expect(manager.isLoading()).toBeFalse();
  });

  it('should expose hasMore from ProductsService', () => {
    expect(manager.hasMore()).toBeTrue();
  });

  it('should expose error as null', () => {
    expect(manager.error()).toBeNull();
  });

  it('should load more products', () => {
    manager.loadMore();
    expect(filtersServiceSpy.loadNextPage).toHaveBeenCalled();
    expect(productsServiceSpy.loadMoreProducts).toHaveBeenCalled();
  });

  it('should expose featuredProducts', () => {
    expect(manager.featuredProducts()).toEqual([]);
  });

  it('should expose totalCount', () => {
    expect(manager.totalCount()).toBe(0);
  });

  it('should expose currentPage', () => {
    expect(manager.currentPage()).toBe(1);
  });
});

describe('ProductListManager with featured enabled', () => {
  let manager: ProductListManager;
  let productsServiceSpy: jasmine.SpyObj<ProductsService>;
  let filtersServiceSpy: jasmine.SpyObj<FiltersService>;

  beforeEach(() => {
    productsServiceSpy = jasmine.createSpyObj(
      'ProductsService',
      ['loadProducts', 'loadMoreProducts', 'loadFeaturedProducts'],
      {
        products: signal([]),
        loading: signal(false),
        loadingMore: signal(false),
        hasMore: signal(true),
        error: signal(null),
        currentPage: signal(1),
        totalCount: signal(0),
        featuredProducts: signal([]),
      },
    );

    filtersServiceSpy = jasmine.createSpyObj(
      'FiltersService',
      ['resetToFirstPage', 'loadNextPage', 'apiParams'],
      {
        categoryId: signal(null),
        minPrice: signal(null),
        maxPrice: signal(null),
        sortBy: signal('name' as const),
        sortDirection: signal('desc' as const),
        searchTerm: signal(null),
      },
    );
    filtersServiceSpy.apiParams.and.returnValue({
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortDirection: 'desc',
    });

    TestBed.configureTestingModule({
      providers: [
        ProductListManager,
        { provide: ProductsService, useValue: productsServiceSpy },
        { provide: FiltersService, useValue: filtersServiceSpy },
        { provide: PRODUCT_LIST_CONFIG, useValue: { loadFeatured: true, featuredLimit: 4 } },
      ],
    });

    manager = TestBed.inject(ProductListManager);
  });

  it('should load featured products when config.loadFeatured is true', () => {
    // The effect triggers on construction
    TestBed.flushEffects();
    expect(productsServiceSpy.loadFeaturedProducts).toHaveBeenCalledWith(undefined, 4);
  });

  it('should not reload featured products when sort changes', () => {
    TestBed.flushEffects();
    productsServiceSpy.loadFeaturedProducts.calls.reset();
    productsServiceSpy.loadProducts.calls.reset();

    (filtersServiceSpy.sortBy as unknown as ReturnType<typeof signal>).set('price');
    TestBed.flushEffects();

    expect(productsServiceSpy.loadProducts).toHaveBeenCalled();
    expect(productsServiceSpy.loadFeaturedProducts).not.toHaveBeenCalled();
  });

  it('should not reload featured products when sort direction changes', () => {
    TestBed.flushEffects();
    productsServiceSpy.loadFeaturedProducts.calls.reset();
    productsServiceSpy.loadProducts.calls.reset();

    (filtersServiceSpy.sortDirection as unknown as ReturnType<typeof signal>).set('asc');
    TestBed.flushEffects();

    expect(productsServiceSpy.loadProducts).toHaveBeenCalled();
    expect(productsServiceSpy.loadFeaturedProducts).not.toHaveBeenCalled();
  });

  it('should reload featured products when category changes', () => {
    TestBed.flushEffects();
    productsServiceSpy.loadFeaturedProducts.calls.reset();

    (filtersServiceSpy.categoryId as unknown as ReturnType<typeof signal>).set('cat-123');
    TestBed.flushEffects();

    expect(productsServiceSpy.loadFeaturedProducts).toHaveBeenCalledWith('cat-123', 4);
  });
});
