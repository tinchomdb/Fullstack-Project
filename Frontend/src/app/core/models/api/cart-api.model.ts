import { CartItemApiModel } from './cart-item-api.model';

export type CartApiModel = {
  readonly id?: string;
  readonly userId?: string;
  readonly status?: string;
  readonly createdAt?: string;
  readonly lastUpdatedAt?: string;
  readonly expiresAt?: string;
  readonly items?: readonly CartItemApiModel[] | null;
  readonly subtotal?: number;
  readonly currency?: string;
  readonly total?: number;
};
