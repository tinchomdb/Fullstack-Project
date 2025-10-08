import { OrderItem } from './order-item.model';
import { OrderStatus } from './order-status.model';

export interface Order {
  readonly id: string;
  readonly userId: string;
  readonly originalCartId?: string;
  readonly orderDate: string;
  readonly status: OrderStatus;
  readonly items: readonly OrderItem[];
  readonly subtotal: number;
  readonly shippingCost: number;
  readonly total: number;
  readonly currency: string;
}
