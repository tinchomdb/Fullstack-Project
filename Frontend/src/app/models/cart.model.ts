import { CartItem } from './cart-item.model';
import { CartStatus } from './cart-status.model';

export interface Cart {
  readonly id: string;
  readonly userId: string;
  readonly status: CartStatus;
  readonly createdAt: string;
  readonly lastUpdatedAt: string;
  readonly expiresAt?: string;
  readonly items: readonly CartItem[];
  readonly subtotal: number;
  readonly currency: string;
  readonly total: number;
}
