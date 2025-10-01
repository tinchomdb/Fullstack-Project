import { SellerApiModel } from './seller-api.model';

export type ProductApiModel = {
  readonly id?: string;
  readonly name?: string;
  readonly description?: string;
  readonly price?: number;
  readonly currency?: string;
  readonly categoryId?: string;
  readonly seller?: SellerApiModel | null;
  readonly imageUrls?: readonly string[] | null;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};
