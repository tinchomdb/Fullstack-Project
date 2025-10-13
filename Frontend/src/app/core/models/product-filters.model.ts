export type ProductSortField = 'name' | 'price';

export type SortDirection = 'asc' | 'desc';

export interface ProductFilters {
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: ProductSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
  categoryId: string | null;
}

export interface ProductFiltersApiParams {
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
  categoryId?: string;
}
