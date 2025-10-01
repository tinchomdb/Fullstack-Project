import { Product } from '../models/product.model';
import { Seller } from '../models/seller.model';
import { ProductApiModel } from '../models/api/product-api.model';
import { SellerApiModel } from '../models/api/seller-api.model';
import { ensureString, ensureNumber } from '../utils/normalization.utils';

export function mapProductFromApi(dto: ProductApiModel): Product {
  return {
    id: ensureString(dto.id),
    name: ensureString(dto.name, 'Unnamed product'),
    description: ensureString(dto.description, 'No description available.'),
    price: ensureNumber(dto.price),
    currency: ensureString(dto.currency, 'USD'),
    categoryId: ensureString(dto.categoryId),
    seller: mapSellerFromApi(dto.seller),
    imageUrls: normalizeImageUrls(dto.imageUrls),
    createdAt: ensureString(dto.createdAt),
    updatedAt: ensureString(dto.updatedAt),
  };
}

export function mapSellerFromApi(dto: SellerApiModel | null | undefined): Seller {
  return {
    id: ensureString(dto?.id),
    displayName: ensureString(dto?.displayName, 'Unknown seller'),
    companyName: dto?.companyName ?? null,
    email: ensureString(dto?.email),
  };
}

function normalizeImageUrls(urls: readonly string[] | null | undefined): readonly string[] {
  if (!urls?.length) {
    return [];
  }

  return urls.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
}
