import { Product } from '../models/product.model';
import { Seller } from '../models/seller.model';
import { ProductApiModel } from '../models/api/product-api.model';
import { SellerApiModel } from '../models/api/seller-api.model';
import { ensureString, ensureNumber } from '../../shared/utils/normalization.utils';

export function mapProductFromApi(dto: ProductApiModel): Product {
  const sellerId = ensureString(dto.sellerId);
  return {
    id: ensureString(dto.id),
    name: ensureString(dto.name, 'Unnamed product'),
    description: ensureString(dto.description, 'No description available.'),
    price: ensureNumber(dto.price),
    currency: ensureString(dto.currency, 'USD'),
    sellerId,
    categoryId: ensureString(dto.categoryId),
    seller: mapSellerFromApi(dto.seller, sellerId),
    imageUrls: normalizeImageUrls(dto.imageUrls),
    createdAt: ensureString(dto.createdAt),
    updatedAt: ensureString(dto.updatedAt),
  };
}

export function mapSellerFromApi(dto: SellerApiModel | null | undefined, fallbackId = ''): Seller {
  return {
    id: ensureString(dto?.id, fallbackId),
    displayName: ensureString(dto?.displayName, 'Unknown seller'),
    companyName: dto?.companyName ?? null,
    email: ensureString(dto?.email),
  };
}

export function mapProductToApi(product: Product): ProductApiModel {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    stock: product.stock ?? 0,
    sellerId: product.sellerId,
    categoryIds: product.categoryIds ?? [product.categoryId],
    imageUrls: product.imageUrls,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    type: 'Product',
  };
}

function normalizeImageUrls(urls: readonly string[] | null | undefined): readonly string[] {
  if (!urls?.length) {
    return [];
  }

  return urls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
}
