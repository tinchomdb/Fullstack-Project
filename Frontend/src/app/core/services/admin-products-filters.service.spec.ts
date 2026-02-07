import { TestBed } from '@angular/core/testing';
import { AdminProductsFiltersService } from './admin-products-filters.service';
import { fakeAsync, tick } from '@angular/core/testing';

describe('AdminProductsFiltersService', () => {
  let service: AdminProductsFiltersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminProductsFiltersService);
  });

  it('should start with default values', () => {
    expect(service.page()).toBe(1);
    expect(service.pageSize()).toBe(20);
    expect(service.categoryId()).toBeNull();
    expect(service.searchTerm()).toBeNull();
    expect(service.sortBy()).toBe('name');
    expect(service.sortDirection()).toBe('asc');
    expect(service.hasActiveFilters()).toBe(false);
  });

  it('should set category id and reset page', () => {
    service.loadNextPage();
    expect(service.page()).toBe(2);

    service.setCategoryId('cat-1');
    expect(service.categoryId()).toBe('cat-1');
    expect(service.page()).toBe(1);
    expect(service.hasActiveFilters()).toBe(true);
  });

  it('should set sort and reset page', () => {
    service.loadNextPage();
    service.setSortBy('price', 'desc');
    expect(service.sortBy()).toBe('price');
    expect(service.sortDirection()).toBe('desc');
    expect(service.page()).toBe(1);
  });

  it('should debounce search term changes', fakeAsync(() => {
    service.setSearchTerm('test');
    expect(service.searchTerm()).toBeNull();

    tick(300); // SEARCH_DEBOUNCE_MS
    expect(service.searchTerm()).toBe('test');
  }));

  it('should clear all filters', fakeAsync(() => {
    service.setCategoryId('cat-1');
    service.setSortBy('price', 'desc');
    service.setSearchTerm('query');
    tick(300);

    service.clearFilters();
    expect(service.categoryId()).toBeNull();
    expect(service.searchTerm()).toBeNull();
    expect(service.sortBy()).toBe('name');
    expect(service.sortDirection()).toBe('asc');
    expect(service.page()).toBe(1);
  }));

  it('should compute API params correctly', () => {
    service.setCategoryId('cat-1');
    const params = service.apiParams();
    expect(params.page).toBe(1);
    expect(params.pageSize).toBe(20);
    expect(params.categoryId).toBe('cat-1');
  });

  it('should increment page on loadNextPage', () => {
    service.loadNextPage();
    expect(service.page()).toBe(2);
    service.loadNextPage();
    expect(service.page()).toBe(3);
  });
});
