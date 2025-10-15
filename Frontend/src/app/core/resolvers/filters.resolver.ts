import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { FiltersService } from '../services/filters.service';
import { CategoriesService } from '../services/categories.service';
import { createBaseFilters, parseCommonFilters } from '../../shared/utils/query-params.util';

/**
 * Universal resolver that parses ALL filter-related data from the URL
 * and sets them in FiltersService. Components pick which filters they need.
 */
export const filtersResolver: ResolveFn<void> = (route: ActivatedRouteSnapshot) => {
  const filtersService = inject(FiltersService);
  const categoriesService = inject(CategoriesService);

  // Start with base filters
  const filters = createBaseFilters();

  // Parse common filters from query params (minPrice, maxPrice, sortBy, sortDirection)
  Object.assign(filters, parseCommonFilters(route.queryParams));

  // Parse search term from query params
  if (typeof route.queryParams['q'] === 'string' && route.queryParams['q'].trim()) {
    filters.searchTerm = route.queryParams['q'].trim();
  }

  // Parse category from URL path (e.g., /category/electronics/phones)
  const categoryPath = route.url.map((segment) => segment.path).join('/');
  if (categoryPath) {
    const category = categoriesService.getCategoryByPath(categoryPath);
    if (category) {
      filters.categoryId = category.id;
    }
  }

  // Set all filters at once
  filtersService.setAllFilters(filters);
};
