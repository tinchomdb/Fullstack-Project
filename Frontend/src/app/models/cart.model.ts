import { CartItem } from './cart-item.model';

export interface Cart {
  readonly id: string;
  readonly userId: string;
  readonly lastUpdatedAt: string;
  readonly items: readonly CartItem[];
  readonly subtotal: number;
  readonly currency: string;
  readonly total: number;
}
