import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderApiService } from './order-api.service';
import { OrderStatus } from '../models/order-status.model';
import { Order } from '../models/order.model';

describe('OrderApiService', () => {
  let service: OrderApiService;
  let httpMock: HttpTestingController;

  const mockOrder: Order = {
    id: 'order-abc-123',
    userId: 'user-1',
    orderDate: '2026-02-09T12:00:00Z',
    status: OrderStatus.Processing,
    items: [
      {
        productId: 'prod-1',
        productName: 'Test Product',
        quantity: 2,
        unitPrice: 25,
        lineTotal: 50,
      },
    ],
    subtotal: 50,
    shippingCost: 5.99,
    total: 55.99,
    currency: 'USD',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch a single order by ID', () => {
    service.getOrder('order-abc-123').subscribe((order) => {
      expect(order.id).toBe('order-abc-123');
      expect(order.status).toBe(OrderStatus.Processing);
      expect(order.items.length).toBe(1);
      expect(order.total).toBe(55.99);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/api/orders/order-abc-123'));
    expect(req.request.method).toBe('GET');
    req.flush(mockOrder);
  });

  it('should fetch all orders for the current user', () => {
    service.getMyOrders().subscribe((orders) => {
      expect(orders.length).toBe(1);
      expect(orders[0].id).toBe('order-abc-123');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/api/orders/my-orders'));
    expect(req.request.method).toBe('GET');
    req.flush([mockOrder]);
  });

  it('should handle error when fetching order', () => {
    service.getOrder('non-existent').subscribe({
      error: (error) => {
        expect(error.status).toBe(404);
      },
    });

    const req = httpMock.expectOne((r) => r.url.includes('/api/orders/non-existent'));
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });
});
