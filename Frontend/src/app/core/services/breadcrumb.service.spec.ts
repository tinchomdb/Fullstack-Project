import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { BreadcrumbService } from './breadcrumb.service';
import { CategoriesService } from './categories.service';

describe('BreadcrumbService', () => {
  let service: BreadcrumbService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CategoriesService,
          useValue: {
            getCategoryPath: jasmine.createSpy('getCategoryPath').and.returnValue([]),
            getCategoryBySlug: jasmine.createSpy('getCategoryBySlug').and.returnValue(undefined),
            categories: signal([]),
          },
        },
      ],
    });
    service = TestBed.inject(BreadcrumbService);
  });

  it('should initialize breadcrumbs on creation', () => {
    expect(service.breadcrumbs()).toBeDefined();
    expect(service.breadcrumbs().length).toBeGreaterThanOrEqual(1);
  });

  it('should have Home as the first breadcrumb', () => {
    expect(service.breadcrumbs()[0].label).toBe('Home');
    expect(service.breadcrumbs()[0].route).toBe('/products');
  });

  it('should update breadcrumbs for product details page', () => {
    service.updateBreadcrumbsForProductDetailsPage('Widget', 'cat-1');
    const crumbs = service.breadcrumbs();
    expect(crumbs[0].label).toBe('Home');
    expect(crumbs[crumbs.length - 1].label).toBe('Widget');
  });
});
