import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StripeService } from './stripe.service';
import { PaymentApiService } from './payment-api.service';
import { OrderApiService } from './order-api.service';
import { OrderStatus } from '../models/order-status.model';

describe('StripeService', () => {
  let service: StripeService;
  let paymentApiSpy: jasmine.SpyObj<PaymentApiService>;
  let orderApiSpy: jasmine.SpyObj<OrderApiService>;

  beforeEach(() => {
    paymentApiSpy = jasmine.createSpyObj('PaymentApiService', ['createPaymentIntent']);

    orderApiSpy = jasmine.createSpyObj('OrderApiService', [
      'getOrder',
      'getOrderByPaymentIntent',
      'getMyOrders',
    ]);

    TestBed.configureTestingModule({
      providers: [
        StripeService,
        { provide: PaymentApiService, useValue: paymentApiSpy },
        { provide: OrderApiService, useValue: orderApiSpy },
      ],
    });

    service = TestBed.inject(StripeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct initial state', () => {
    expect(service.isReady()).toBeFalse();
    expect(service.isFormComplete()).toBeFalse();
    expect(service.isInitializing()).toBeFalse();
    expect(service.isMounted()).toBeFalse();
    expect(service.clientSecret()).toBeNull();
    expect(service.paymentIntentId()).toBeNull();
  });

  it('should throw when mounting before initialization', () => {
    expect(() => service.mountPaymentElement()).toThrowError('Stripe elements not initialized');
  });

  it('should throw when confirming before initialization', async () => {
    await expectAsync(service.confirmPayment('http://return')).toBeRejectedWithError(
      'Stripe not initialized',
    );
  });

  it('should return error when completing without payment intent', () => {
    service.completePayment().subscribe({
      error: (err) => {
        expect(err.message).toBe('Payment intent ID not available');
      },
    });
  });

  it('should reset all state', () => {
    service.clientSecret.set('secret_123');
    service.paymentIntentId.set('pi_123');
    service.isReady.set(true);

    service.reset();

    expect(service.clientSecret()).toBeNull();
    expect(service.paymentIntentId()).toBeNull();
    expect(service.isReady()).toBeFalse();
    expect(service.isInitializing()).toBeFalse();
    expect(service.isMounted()).toBeFalse();
    expect(service.isFormComplete()).toBeFalse();
  });

  it('should destroy payment element on unmount', () => {
    const mockPaymentElement = {
      destroy: jasmine.createSpy('destroy'),
      on: jasmine.createSpy('on'),
    };
    (service as any).paymentElement = mockPaymentElement;
    service.isMounted.set(true);

    service.unmountPaymentElement();

    expect(mockPaymentElement.destroy).toHaveBeenCalled();
    expect(service.isMounted()).toBeFalse();
    expect(service.isFormComplete()).toBeFalse();
  });

  it('should call createPaymentIntent on initializePayment', () => {
    paymentApiSpy.createPaymentIntent.and.returnValue(
      of({ clientSecret: 'cs_test', paymentIntentId: 'pi_test', amount: 5000 }),
    );

    // Mock the private initialize method to avoid loading real Stripe.js
    spyOn(service as any, 'initialize').and.returnValue(Promise.resolve());

    service.initializePayment(5000, 'test@test.com', 'cart-1', 5.99).subscribe();

    expect(paymentApiSpy.createPaymentIntent).toHaveBeenCalledWith({
      amount: 5000,
      email: 'test@test.com',
      cartId: 'cart-1',
      shippingCost: 5.99,
    });
  });

  it('should poll orderApi and return orderId on completePayment', (done) => {
    service.paymentIntentId.set('pi_123');

    const mockOrder = {
      id: 'order-from-webhook',
      userId: 'user-1',
      orderDate: '2026-02-09T12:00:00Z',
      status: OrderStatus.Processing,
      items: [],
      subtotal: 100,
      shippingCost: 5.99,
      total: 105.99,
      currency: 'USD',
    };

    orderApiSpy.getOrderByPaymentIntent.and.returnValue(of(mockOrder));

    service.completePayment().subscribe((orderId) => {
      expect(orderId).toBe('order-from-webhook');
      expect(orderApiSpy.getOrderByPaymentIntent).toHaveBeenCalledWith('pi_123');
      done();
    });
  });

  it('should retry polling on 404 and succeed when order appears', (done) => {
    service.paymentIntentId.set('pi_123');

    const notFoundError = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    const mockOrder = {
      id: 'order-delayed',
      userId: 'user-1',
      orderDate: '2026-02-09T12:00:00Z',
      status: OrderStatus.Processing,
      items: [],
      subtotal: 100,
      shippingCost: 5.99,
      total: 105.99,
      currency: 'USD',
    };

    let callCount = 0;
    orderApiSpy.getOrderByPaymentIntent.and.callFake(() => {
      callCount++;
      if (callCount < 3) {
        return throwError(() => notFoundError);
      }
      return of(mockOrder);
    });

    service.completePayment().subscribe((orderId) => {
      expect(orderId).toBe('order-delayed');
      expect(callCount).toBe(3);
      done();
    });
  });
});
