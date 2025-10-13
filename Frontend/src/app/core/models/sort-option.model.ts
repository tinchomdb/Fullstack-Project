import { ProductSortField, SortDirection } from './product-filters.model';

export interface SortOption {
  label: string;
  sortBy: ProductSortField;
  sortDirection: SortDirection;
  value: string;
}

export const SORT_OPTIONS: readonly SortOption[] = [
  {
    label: 'Name A-Z',
    sortBy: 'name',
    sortDirection: 'asc',
    value: 'name-asc',
  },
  {
    label: 'Name Z-A',
    sortBy: 'name',
    sortDirection: 'desc',
    value: 'name-desc',
  },
  {
    label: 'Price Low to High',
    sortBy: 'price',
    sortDirection: 'asc',
    value: 'price-asc',
  },
  {
    label: 'Price High to Low',
    sortBy: 'price',
    sortDirection: 'desc',
    value: 'price-desc',
  },
] as const;

export const DEFAULT_SORT_OPTION = SORT_OPTIONS[0];
