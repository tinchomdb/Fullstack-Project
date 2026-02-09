import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SearchResultsComponent } from './search-results.component';
import { ProductListManager, PRODUCT_LIST_CONFIG } from '../../core/managers/product-list.manager';
import { FiltersService } from '../../core/services/filters.service';
import { CartService } from '../../core/services/cart.service';

import { Product } from '../../core/models/product.model';
import { DEFAULT_SORT_OPTION } from '../../core/models/sort-option.model';

describe('SearchResultsComponent', () => {
  let component: SearchResultsComponent;
  let fixture: ComponentFixture<SearchResultsComponent>;
  let listManager: jasmine.SpyObj<ProductListManager>;
  let filtersService: jasmine.SpyObj<FiltersService>;

  const searchTermSignal = signal<string | null>('shoes');

  beforeEach(() => {
    searchTermSignal.set('shoes');

    listManager = jasmine.createSpyObj('ProductListManager', ['loadMore'], {
      products: signal<Product[]>([]),
      isLoadingInitial: signal(false),
      isLoadingMore: signal(false),
      hasMore: signal(false),
      error: signal<string | null>(null),
      totalCount: signal(42),
    });

    filtersService = jasmine.createSpyObj('FiltersService', ['resetToFirstPage'], {
      searchTerm: searchTermSignal,
      currentSortOption: signal(DEFAULT_SORT_OPTION),
      setSortOption: jasmine.createSpy('setSortOption'),
    });

    TestBed.configureTestingModule({
      imports: [SearchResultsComponent],
      providers: [
        { provide: FiltersService, useValue: filtersService },
        {
          provide: CartService,
          useValue: {
            addToCart: jasmine.createSpy('addToCart').and.returnValue({ subscribe: () => {} }),
          },
        },
      ],
    }).overrideComponent(SearchResultsComponent, {
      set: {
        template: '',
        providers: [
          { provide: ProductListManager, useValue: listManager },
          { provide: PRODUCT_LIST_CONFIG, useValue: { loadFeatured: false } },
        ],
      },
    });

    fixture = TestBed.createComponent(SearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute searchTerm from FiltersService', () => {
    expect((component as any).searchTerm()).toBe('shoes');
  });

  it('should compute pageHeading with search term', () => {
    expect((component as any).pageHeading()).toBe('Results for "shoes"');
  });

  it('should show default heading when no search term', () => {
    searchTermSignal.set(null);
    expect((component as any).pageHeading()).toBe('Search Results');
  });

  it('should compute resultsCount from list manager', () => {
    expect((component as any).resultsCount()).toBe(42);
  });

  it('should delegate loadMore to list manager', () => {
    (component as any).onLoadMore();
    expect(listManager.loadMore).toHaveBeenCalled();
  });
});
