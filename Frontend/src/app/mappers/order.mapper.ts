import { Order } from '../models/order.model';
import { OrderItem } from '../models/order-item.model';
import { OrderStatus } from '../models/order-status.model';
import { OrderApiModel } from '../models/api/order-api.model';
import { OrderItemApiModel } from '../models/api/order-item-api.model';
import { ensureString, ensureNumber } from '../shared/utils/normalization.utils';

export function mapOrderFromApi(dto: OrderApiModel): Order {
  return {
    id: ensureString(dto.id),
    userId: ensureString(dto.userId),
    originalCartId: dto.originalCartId ? ensureString(dto.originalCartId) : undefined,
    orderDate: ensureString(dto.orderDate),
    status: mapOrderStatusFromApi(dto.status),
    items: normalizeOrderItems(dto.items),
    subtotal: ensureNumber(dto.subtotal),
    shippingCost: ensureNumber(dto.shippingCost),
    total: ensureNumber(dto.total),
    currency: ensureString(dto.currency, 'USD'),
  };
}

export function mapOrderItemFromApi(dto: OrderItemApiModel): OrderItem {
  return {
    productId: ensureString(dto.productId),
    productName: ensureString(dto.productName, 'Unknown product'),
    quantity: ensureNumber(dto.quantity),
    unitPrice: ensureNumber(dto.unitPrice),
    lineTotal: ensureNumber(dto.lineTotal),
  };
}

function mapOrderStatusFromApi(status?: string): OrderStatus {
  switch (status) {
    case 'Pending':
      return OrderStatus.Pending;
    case 'Processing':
      return OrderStatus.Processing;
    case 'Shipped':
      return OrderStatus.Shipped;
    case 'Delivered':
      return OrderStatus.Delivered;
    case 'Cancelled':
      return OrderStatus.Cancelled;
    case 'Refunded':
      return OrderStatus.Refunded;
    default:
      return OrderStatus.Pending;
  }
}

function normalizeOrderItems(
  items: readonly OrderItemApiModel[] | null | undefined,
): readonly OrderItem[] {
  if (!items?.length) {
    return [];
  }

  return items.map(mapOrderItemFromApi);
}
