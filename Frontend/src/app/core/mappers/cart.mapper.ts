import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { CartStatus } from '../models/cart-status.model';
import { CartApiModel } from '../models/api/cart-api.model';
import { CartItemApiModel } from '../models/api/cart-item-api.model';
import { ensureString, ensureNumber } from '../../shared/utils/normalization.utils';

export function mapCartFromApi(dto: CartApiModel): Cart {
  return {
    id: ensureString(dto.id),
    userId: ensureString(dto.userId),
    status: mapCartStatusFromApi(dto.status),
    createdAt: ensureString(dto.createdAt),
    lastUpdatedAt: ensureString(dto.lastUpdatedAt),
    expiresAt: dto.expiresAt ? ensureString(dto.expiresAt) : undefined,
    items: normalizeCartItems(dto.items),
    subtotal: ensureNumber(dto.subtotal),
    currency: ensureString(dto.currency, 'USD'),
    total: ensureNumber(dto.total),
  };
}

export function mapCartItemFromApi(dto: CartItemApiModel): CartItem {
  return {
    productId: ensureString(dto.productId),
    productName: ensureString(dto.productName, 'Unknown product'),
    imageUrl: ensureString(dto.imageUrl),
    quantity: ensureNumber(dto.quantity),
    unitPrice: ensureNumber(dto.unitPrice),
    lineTotal: ensureNumber(dto.lineTotal),
  };
}

function mapCartStatusFromApi(status?: string): CartStatus {
  switch (status) {
    case 'Active':
      return CartStatus.Active;
    case 'Abandoned':
      return CartStatus.Abandoned;
    case 'CheckingOut':
      return CartStatus.CheckingOut;
    case 'Completed':
      return CartStatus.Completed;
    default:
      return CartStatus.Active;
  }
}

function normalizeCartItems(
  items: readonly CartItemApiModel[] | null | undefined,
): readonly CartItem[] {
  if (!items?.length) {
    return [];
  }

  return items.map(mapCartItemFromApi);
}
