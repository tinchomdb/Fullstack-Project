import { Params } from '@angular/router';
import {
  ProductFiltersApiParams,
  ProductSortField,
  SortDirection,
} from '../../core/models/product-filters.model';
import { DEFAULT_SORT_OPTION } from '../../core/models/sort-option.model';

/**
 * Parses a price value from query params
 * @param value - The query param value to parse
 * @returns Parsed price or undefined if invalid
 */
export function parsePrice(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;

  const price = parseFloat(value);
  if (isNaN(price) || price < 0) return undefined;

  return price;
}

/**
 * Parses sort parameters from query params
 * @param params - Query params object
 * @returns Validated sort field and direction
 */
export function parseSort(params: Params): {
  sortBy: ProductSortField;
  sortDirection: SortDirection;
} {
  const sortBy = params['sortBy'];
  const sortDirection = params['sortDirection'];

  if (
    (sortBy === 'name' || sortBy === 'price') &&
    (sortDirection === 'asc' || sortDirection === 'desc')
  ) {
    return {
      sortBy: sortBy as ProductSortField,
      sortDirection: sortDirection as SortDirection,
    };
  }

  return {
    sortBy: DEFAULT_SORT_OPTION.sortBy,
    sortDirection: DEFAULT_SORT_OPTION.sortDirection,
  };
}

/**
 * Parses common filter parameters from query params
 * Includes: minPrice, maxPrice, sortBy, sortDirection
 * @param params - Query params object
 * @returns Partial ProductFiltersApiParams with common filters
 */
export function parseCommonFilters(params: Params): Partial<ProductFiltersApiParams> {
  const filters: Partial<ProductFiltersApiParams> = {};

  // Parse sort
  const { sortBy, sortDirection } = parseSort(params);
  filters.sortBy = sortBy;
  filters.sortDirection = sortDirection;

  return filters;
}

/**
 * Creates base filter parameters with defaults
 * @param pageSize - Page size (default: 4)
 * @returns Base ProductFiltersApiParams object
 */
export function createBaseFilters(pageSize: number = 20): ProductFiltersApiParams {
  return {
    page: 1,
    pageSize,
    sortBy: DEFAULT_SORT_OPTION.sortBy,
    sortDirection: DEFAULT_SORT_OPTION.sortDirection,
  };
}
