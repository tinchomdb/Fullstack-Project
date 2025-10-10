import { Seller } from './seller.model';

export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly currency: string;
  readonly stock?: number;
  readonly sellerId: string;
  readonly categoryId: string;
  readonly categoryIds?: readonly string[];
  readonly seller: Seller;
  readonly imageUrls: readonly string[];
  readonly featured?: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
