export type ProductSortField = 'name' | 'price';

export type SortDirection = 'asc' | 'desc';

export interface ProductFilters {
  sortBy: ProductSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
  categoryId: string | null;
  searchTerm: string | null;
}

export interface ProductFiltersApiParams {
  sortBy?: ProductSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
  categoryId?: string;
  searchTerm?: string;
}
