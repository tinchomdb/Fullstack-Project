import { SellerApiModel } from './seller-api.model';

export type ProductApiModel = {
  readonly id?: string;
  readonly slug?: string;
  readonly name?: string;
  readonly description?: string;
  readonly price?: number;
  readonly currency?: string;
  readonly stock?: number;
  readonly sellerId?: string;
  readonly categoryIds?: readonly string[];
  readonly seller?: SellerApiModel | null;
  readonly imageUrls?: readonly string[] | null;
  readonly featured?: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly type?: string;
};
