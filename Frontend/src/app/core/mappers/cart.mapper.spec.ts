import { mapCartFromApi, mapCartItemFromApi } from './cart.mapper';
import { CartStatus } from '../models/cart-status.model';
import { CartApiModel } from '../models/api/cart-api.model';
import { CartItemApiModel } from '../models/api/cart-item-api.model';

describe('cart.mapper', () => {
  describe('mapCartFromApi', () => {
    it('should map a fully populated cart', () => {
      const dto: CartApiModel = {
        id: 'cart-1',
        userId: 'user-1',
        status: 'Active',
        createdAt: '2025-01-01',
        lastUpdatedAt: '2025-01-02',
        expiresAt: '2025-02-01',
        items: [
          {
            productId: 'p1',
            productName: 'Item A',
            slug: 'item-a',
            imageUrl: 'img.jpg',
            sellerId: 's1',
            sellerName: 'Seller A',
            quantity: 2,
            unitPrice: 10.0,
            lineTotal: 20.0,
          },
        ],
        subtotal: 20.0,
        currency: 'EUR',
        total: 25.0,
      };

      const result = mapCartFromApi(dto);

      expect(result.id).toBe('cart-1');
      expect(result.userId).toBe('user-1');
      expect(result.status).toBe(CartStatus.Active);
      expect(result.items.length).toBe(1);
      expect(result.items[0].productName).toBe('Item A');
      expect(result.subtotal).toBe(20.0);
      expect(result.currency).toBe('EUR');
      expect(result.total).toBe(25.0);
      expect(result.expiresAt).toBe('2025-02-01');
    });

    it('should handle empty API model with defaults', () => {
      const dto: CartApiModel = {};

      const result = mapCartFromApi(dto);

      expect(result.id).toBe('');
      expect(result.userId).toBe('');
      expect(result.status).toBe(CartStatus.Active);
      expect(result.items).toEqual([]);
      expect(result.subtotal).toBe(0);
      expect(result.currency).toBe('USD');
      expect(result.total).toBe(0);
      expect(result.expiresAt).toBeUndefined();
    });

    it('should handle null items', () => {
      const dto: CartApiModel = { items: null };
      const result = mapCartFromApi(dto);
      expect(result.items).toEqual([]);
    });

    it('should map all cart statuses correctly', () => {
      const statusMap: Record<string, CartStatus> = {
        Active: CartStatus.Active,
        Abandoned: CartStatus.Abandoned,
        CheckingOut: CartStatus.CheckingOut,
        Completed: CartStatus.Completed,
      };

      for (const [apiStatus, expectedStatus] of Object.entries(statusMap)) {
        const dto: CartApiModel = { status: apiStatus };
        const result = mapCartFromApi(dto);
        expect(result.status).toBe(expectedStatus);
      }
    });

    it('should default unknown status to Active', () => {
      const dto: CartApiModel = { status: 'InvalidStatus' };
      const result = mapCartFromApi(dto);
      expect(result.status).toBe(CartStatus.Active);
    });
  });

  describe('mapCartItemFromApi', () => {
    it('should map a fully populated cart item', () => {
      const dto: CartItemApiModel = {
        productId: 'p1',
        productName: 'Widget',
        slug: 'widget',
        imageUrl: 'widget.jpg',
        sellerId: 's1',
        sellerName: 'Widgets Inc',
        quantity: 3,
        unitPrice: 15.5,
        lineTotal: 46.5,
      };

      const result = mapCartItemFromApi(dto);

      expect(result.productId).toBe('p1');
      expect(result.productName).toBe('Widget');
      expect(result.slug).toBe('widget');
      expect(result.quantity).toBe(3);
      expect(result.unitPrice).toBe(15.5);
      expect(result.lineTotal).toBe(46.5);
    });

    it('should apply defaults for missing cart item fields', () => {
      const dto: CartItemApiModel = {};

      const result = mapCartItemFromApi(dto);

      expect(result.productId).toBe('');
      expect(result.productName).toBe('Unknown product');
      expect(result.slug).toBe('');
      expect(result.sellerName).toBe('Unknown seller');
      expect(result.quantity).toBe(0);
      expect(result.unitPrice).toBe(0);
      expect(result.lineTotal).toBe(0);
    });
  });
});
