import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StripeService } from './stripe.service';
import { PaymentApiService } from './payment-api.service';

describe('StripeService', () => {
  let service: StripeService;
  let paymentApiSpy: jasmine.SpyObj<PaymentApiService>;

  beforeEach(() => {
    paymentApiSpy = jasmine.createSpyObj('PaymentApiService', [
      'createPaymentIntent',
      'testCompletePayment',
    ]);

    TestBed.configureTestingModule({
      providers: [StripeService, { provide: PaymentApiService, useValue: paymentApiSpy }],
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
    service.completePayment('cart-1', 'test@test.com', 5000).subscribe({
      error: (err) => {
        expect(err.message).toBe('Payment intent ID not available');
      },
    });
  });

  it('should reset all state', () => {
    (service as any)._clientSecret.set('secret_123');
    (service as any)._paymentIntentId.set('pi_123');
    (service as any)._isReady.set(true);

    service.reset();

    expect(service.clientSecret()).toBeNull();
    expect(service.paymentIntentId()).toBeNull();
    expect(service.isReady()).toBeFalse();
    expect(service.isInitializing()).toBeFalse();
    expect(service.isMounted()).toBeFalse();
    expect(service.isFormComplete()).toBeFalse();
  });

  it('should call createPaymentIntent on initializePayment', () => {
    paymentApiSpy.createPaymentIntent.and.returnValue(
      of({ clientSecret: 'cs_test', paymentIntentId: 'pi_test', amount: 5000 }),
    );

    // The Stripe loadStripe might fail in test environment, but the API call should happen
    service.initializePayment(5000, 'test@test.com', 'cart-1', 5.99).subscribe({
      error: () => {
        // loadStripe may fail in test without real Stripe keys
      },
    });

    expect(paymentApiSpy.createPaymentIntent).toHaveBeenCalledWith({
      amount: 5000,
      email: 'test@test.com',
      cartId: 'cart-1',
      shippingCost: 5.99,
    });
  });

  it('should call testCompletePayment when completePayment is invoked', () => {
    (service as any)._paymentIntentId.set('pi_123');
    paymentApiSpy.testCompletePayment.and.returnValue(of({ success: true, message: 'OK' }));

    service.completePayment('cart-1', 'test@test.com', 5000).subscribe();

    expect(paymentApiSpy.testCompletePayment).toHaveBeenCalledWith({
      paymentIntentId: 'pi_123',
      cartId: 'cart-1',
      email: 'test@test.com',
      amount: 5000,
    });
  });
});
