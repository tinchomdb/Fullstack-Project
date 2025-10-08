import { OrderItemApiModel } from './order-item-api.model';

export type OrderApiModel = {
  readonly id?: string;
  readonly userId?: string;
  readonly originalCartId?: string;
  readonly orderDate?: string;
  readonly status?: string;
  readonly items?: readonly OrderItemApiModel[] | null;
  readonly subtotal?: number;
  readonly shippingCost?: number;
  readonly total?: number;
  readonly currency?: string;
};
