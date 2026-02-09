import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { signal } from '@angular/core';
import { FiltersService } from './filters.service';
import { CategoriesService } from './categories.service';
import { DEFAULT_SORT_OPTION, SORT_OPTIONS } from '../models/sort-option.model';

describe('FiltersService', () => {
  let service: FiltersService;
  let routerEvents$: Subject<NavigationEnd>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerEvents$ = new Subject();
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl'], {
      events: routerEvents$.asObservable(),
      url: '/products',
    });
    routerSpy.parseUrl.and.returnValue({
      queryParams: {},
      root: { children: { primary: { segments: [{ path: 'products' }] } } },
    } as any);

    TestBed.configureTestingModule({
      providers: [
        FiltersService,
        { provide: Router, useValue: routerSpy },
        {
          provide: CategoriesService,
          useValue: {
            categories: signal([]),
            getCategoryByPath: jasmine.createSpy('getCategoryByPath').and.returnValue(null),
          },
        },
      ],
    });

    service = TestBed.inject(FiltersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default state', () => {
    expect(service.minPrice()).toBeNull();
    expect(service.maxPrice()).toBeNull();
    expect(service.currentSortOption()).toEqual(DEFAULT_SORT_OPTION);
    expect(service.page()).toBe(1);
    expect(service.pageSize()).toBe(20);
    expect(service.categoryId()).toBeNull();
    expect(service.searchTerm()).toBeNull();
  });

  it('should compute sortBy from current sort option', () => {
    expect(service.sortBy()).toBe(DEFAULT_SORT_OPTION.sortBy);
    expect(service.sortDirection()).toBe(DEFAULT_SORT_OPTION.sortDirection);
  });

  it('should compute hasActiveFilters as false when defaults', () => {
    expect(service.hasActiveFilters()).toBeFalse();
  });

  it('should set sort option and reset to first page', () => {
    service.loadNextPage();
    expect(service.page()).toBe(2);

    const newSort = SORT_OPTIONS[1];
    service.setSortOption(newSort);
    expect(service.currentSortOption()).toEqual(newSort);
    expect(service.page()).toBe(1);
  });

  it('should load next page', () => {
    expect(service.page()).toBe(1);
    service.loadNextPage();
    expect(service.page()).toBe(2);
    service.loadNextPage();
    expect(service.page()).toBe(3);
  });

  it('should set all filters', () => {
    service.setAllFilters({
      categoryId: 'cat-1',
      searchTerm: 'phone',
      page: 3,
      pageSize: 50,
    });

    expect(service.categoryId()).toBe('cat-1');
    expect(service.searchTerm()).toBe('phone');
    expect(service.page()).toBe(3);
    expect(service.pageSize()).toBe(50);
  });

  it('should trim search term and set null for empty', () => {
    service.setAllFilters({ searchTerm: '  ' });
    expect(service.searchTerm()).toBeNull();

    service.setAllFilters({ searchTerm: '  phone  ' });
    expect(service.searchTerm()).toBe('phone');
  });

  it('should reset to first page', () => {
    service.loadNextPage();
    service.loadNextPage();
    expect(service.page()).toBe(3);

    service.resetToFirstPage();
    expect(service.page()).toBe(1);
  });

  it('should compute filters object', () => {
    const filters = service.filters();
    expect(filters.page).toBe(1);
    expect(filters.pageSize).toBe(20);
    expect(filters.sortBy).toBeTruthy();
    expect(filters.sortDirection).toBeTruthy();
  });

  it('should compute apiParams', () => {
    const params = service.apiParams();
    expect(params.page).toBe(1);
    expect(params.pageSize).toBe(20);
    expect(params.categoryId).toBeUndefined();
    expect(params.searchTerm).toBeUndefined();
  });

  it('should include categoryId in apiParams when set', () => {
    service.setAllFilters({ categoryId: 'cat-1' });
    expect(service.apiParams().categoryId).toBe('cat-1');
  });

  it('should include searchTerm in apiParams when set', () => {
    service.setAllFilters({ searchTerm: 'phone' });
    expect(service.apiParams().searchTerm).toBe('phone');
  });

  it('should ignore invalid page values', () => {
    service.setAllFilters({ page: 0 });
    expect(service.page()).toBe(1);

    service.setAllFilters({ page: -1 });
    expect(service.page()).toBe(1);
  });

  it('should compute currentSortValue from current sort option', () => {
    expect(service.currentSortValue()).toBe(DEFAULT_SORT_OPTION.value);
  });

  it('should set sort by value', () => {
    const target = SORT_OPTIONS[1];
    service.setSortByValue(target.value);
    expect(service.currentSortOption()).toEqual(target);
    expect(service.currentSortValue()).toBe(target.value);
  });

  it('should not change sort when value is invalid', () => {
    service.setSortByValue('nonexistent-value');
    expect(service.currentSortOption()).toEqual(DEFAULT_SORT_OPTION);
  });
});
