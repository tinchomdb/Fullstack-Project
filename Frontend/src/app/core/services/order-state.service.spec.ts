import { OrderStateService } from './order-state.service';
import { Order } from '../models/order.model';
import { OrderStatus } from '../models/order-status.model';
import { fakeAsync, tick } from '@angular/core/testing';

describe('OrderStateService', () => {
  let service: OrderStateService;

  const mockOrder: Order = {
    id: 'ord-1',
    userId: 'u1',
    orderDate: '2025-01-01',
    status: OrderStatus.Pending,
    items: [],
    subtotal: 100,
    shippingCost: 5,
    total: 105,
    currency: 'USD',
  };

  beforeEach(() => {
    service = new OrderStateService();
  });

  it('should start with null order', () => {
    expect(service.order()).toBeNull();
  });

  it('should store the last order', () => {
    service.setLastOrder(mockOrder);
    expect(service.order()).toEqual(mockOrder);
  });

  it('should clear the last order', () => {
    service.setLastOrder(mockOrder);
    service.clearLastOrder();
    expect(service.order()).toBeNull();
  });

  it('should auto-clear after 5 minutes', fakeAsync(() => {
    service.setLastOrder(mockOrder);
    expect(service.order()).toEqual(mockOrder);

    tick(5 * 60 * 1000);
    expect(service.order()).toBeNull();
  }));

  it('should reset the auto-clear timer when a new order is set', fakeAsync(() => {
    service.setLastOrder(mockOrder);
    tick(4 * 60 * 1000); // 4 minutes

    const newOrder = { ...mockOrder, id: 'ord-2' };
    service.setLastOrder(newOrder);

    tick(4 * 60 * 1000); // 4 more minutes (total 8 from first, 4 from second)
    expect(service.order()).toEqual(newOrder);

    tick(1 * 60 * 1000); // 5 minutes from second set
    expect(service.order()).toBeNull();
  }));
});
