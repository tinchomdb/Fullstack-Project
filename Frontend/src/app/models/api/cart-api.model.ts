import { CartItemApiModel } from './cart-item-api.model';

export type CartApiModel = {
  readonly id?: string;
  readonly userId?: string;
  readonly lastUpdatedAt?: string;
  readonly items?: readonly CartItemApiModel[] | null;
  readonly subtotal?: number;
  readonly currency?: string;
  readonly total?: number;
};
