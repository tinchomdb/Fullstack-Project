import { mapOrderFromApi, mapOrderItemFromApi } from './order.mapper';
import { OrderStatus } from '../models/order-status.model';
import { OrderApiModel } from '../models/api/order-api.model';
import { OrderItemApiModel } from '../models/api/order-item-api.model';

describe('order.mapper', () => {
  describe('mapOrderFromApi', () => {
    it('should map a fully populated order', () => {
      const dto: OrderApiModel = {
        id: 'ord-1',
        userId: 'u1',
        originalCartId: 'cart-1',
        orderDate: '2025-03-15',
        status: 'Processing',
        items: [
          { productId: 'p1', productName: 'Item', quantity: 1, unitPrice: 10, lineTotal: 10 },
        ],
        subtotal: 10,
        shippingCost: 5,
        total: 15,
        currency: 'EUR',
      };

      const result = mapOrderFromApi(dto);

      expect(result.id).toBe('ord-1');
      expect(result.userId).toBe('u1');
      expect(result.originalCartId).toBe('cart-1');
      expect(result.orderDate).toBe('2025-03-15');
      expect(result.status).toBe(OrderStatus.Processing);
      expect(result.items.length).toBe(1);
      expect(result.subtotal).toBe(10);
      expect(result.shippingCost).toBe(5);
      expect(result.total).toBe(15);
      expect(result.currency).toBe('EUR');
    });

    it('should handle empty API model with defaults', () => {
      const dto: OrderApiModel = {};

      const result = mapOrderFromApi(dto);

      expect(result.id).toBe('');
      expect(result.userId).toBe('');
      expect(result.originalCartId).toBeUndefined();
      expect(result.status).toBe(OrderStatus.Pending);
      expect(result.items).toEqual([]);
      expect(result.subtotal).toBe(0);
      expect(result.shippingCost).toBe(0);
      expect(result.total).toBe(0);
      expect(result.currency).toBe('USD');
    });

    it('should map all order statuses correctly', () => {
      const cases: [string, OrderStatus][] = [
        ['Pending', OrderStatus.Pending],
        ['Processing', OrderStatus.Processing],
        ['Shipped', OrderStatus.Shipped],
        ['Delivered', OrderStatus.Delivered],
        ['Cancelled', OrderStatus.Cancelled],
        ['Refunded', OrderStatus.Refunded],
      ];

      for (const [apiStatus, expected] of cases) {
        const dto: OrderApiModel = { status: apiStatus };
        expect(mapOrderFromApi(dto).status).toBe(expected);
      }
    });

    it('should default unknown status to Pending', () => {
      const dto: OrderApiModel = { status: 'Unknown' };
      expect(mapOrderFromApi(dto).status).toBe(OrderStatus.Pending);
    });

    it('should handle null items', () => {
      const dto: OrderApiModel = { items: null };
      expect(mapOrderFromApi(dto).items).toEqual([]);
    });
  });

  describe('mapOrderItemFromApi', () => {
    it('should map a fully populated order item', () => {
      const dto: OrderItemApiModel = {
        productId: 'p1',
        productName: 'Widget',
        quantity: 3,
        unitPrice: 10.5,
        lineTotal: 31.5,
      };

      const result = mapOrderItemFromApi(dto);

      expect(result.productId).toBe('p1');
      expect(result.productName).toBe('Widget');
      expect(result.quantity).toBe(3);
      expect(result.unitPrice).toBe(10.5);
      expect(result.lineTotal).toBe(31.5);
    });

    it('should apply defaults for missing fields', () => {
      const dto: OrderItemApiModel = {};

      const result = mapOrderItemFromApi(dto);

      expect(result.productId).toBe('');
      expect(result.productName).toBe('Unknown product');
      expect(result.quantity).toBe(0);
      expect(result.unitPrice).toBe(0);
      expect(result.lineTotal).toBe(0);
    });
  });
});
