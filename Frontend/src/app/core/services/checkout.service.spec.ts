import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { CheckoutService } from './checkout.service';
import { CartService } from './cart.service';
import { StripeService } from './stripe.service';
import { OrderStateService } from './order-state.service';
import { AuthService } from '../auth/auth.service';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let cartServiceSpy: jasmine.SpyObj<CartService>;
  let stripeServiceSpy: jasmine.SpyObj<StripeService>;
  let orderStateSpy: jasmine.SpyObj<OrderStateService>;

  beforeEach(() => {
    cartServiceSpy = jasmine.createSpyObj('CartService', ['validateCheckout', 'loadCart'], {
      cart: signal({
        id: 'cart-1',
        userId: 'user-1',
        items: [],
        subtotal: 100,
        total: 100,
        currency: 'USD',
        status: 'active',
        createdAt: '',
        updatedAt: '',
      }),
      isEmpty: signal(false),
      cartUserId: signal('user-1'),
    });

    stripeServiceSpy = jasmine.createSpyObj(
      'StripeService',
      ['initializePayment', 'confirmPayment', 'completePayment'],
      {
        isReady: signal(true),
        isFormComplete: signal(true),
        isInitializing: signal(false),
        clientSecret: signal('secret_123'),
        paymentIntentId: signal('pi_123'),
      },
    );

    orderStateSpy = jasmine.createSpyObj('OrderStateService', ['setLastOrder']);

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        CheckoutService,
        { provide: CartService, useValue: cartServiceSpy },
        { provide: StripeService, useValue: stripeServiceSpy },
        { provide: OrderStateService, useValue: orderStateSpy },
        { provide: AuthService, useValue: { userId: signal('user-1') } },
      ],
    });

    service = TestBed.inject(CheckoutService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have valid shipping options', () => {
    expect(service.shippingOptions.length).toBe(3);
    expect(service.shippingOptions[0].value).toBe('standard');
  });

  it('should create shipping form with required validators', () => {
    expect(service.shippingForm).toBeTruthy();
    expect(service.shippingForm.get('firstName')).toBeTruthy();
    expect(service.shippingForm.get('email')).toBeTruthy();
    expect(service.shippingForm.get('country')).toBeTruthy();
  });

  it('should default country to United States', () => {
    expect(service.shippingForm.get('country')?.value).toBe('United States');
  });

  it('should default shipping option to standard', () => {
    expect(service.shippingOptionForm.get('shippingOption')?.value).toBe('standard');
  });

  it('should not be processing initially', () => {
    expect(service.isProcessing()).toBeFalse();
  });

  it('should have no error initially', () => {
    expect(service.error()).toBeNull();
  });

  it('should compute totalWithShipping', () => {
    const total = service.totalWithShipping();
    expect(total).toBeGreaterThan(0);
  });

  it('should initialize payment', () => {
    stripeServiceSpy.initializePayment.and.returnValue(of(void 0));
    service.shippingForm.patchValue({ email: 'test@example.com' });

    service.initializePayment().subscribe();
    expect(stripeServiceSpy.initializePayment).toHaveBeenCalled();
  });

  it('should set error when payment initialization fails', () => {
    spyOn(console, 'error');
    stripeServiceSpy.initializePayment.and.returnValue(throwError(() => new Error('Init failed')));
    service.shippingForm.patchValue({ email: 'test@example.com' });

    service.initializePayment().subscribe({
      error: () => {
        expect(service.error()).toBe('Failed to initialize payment. Please try again.');
      },
    });
  });

  it('should validate cart', () => {
    cartServiceSpy.validateCheckout.and.returnValue(
      of({
        isValid: true,
        cartId: 'cart-1',
        subtotal: 100,
        shippingCost: 5,
        total: 105,
        warnings: [],
      }),
    );

    service.validateCart().subscribe((result) => {
      expect(result.isValid).toBeTrue();
    });
  });

  it('should set error when cart validation fails', () => {
    spyOn(console, 'error');
    cartServiceSpy.validateCheckout.and.returnValue(
      throwError(() => new Error('Validation failed')),
    );

    service.validateCart().subscribe({
      error: () => {
        expect(service.error()).toBe('Failed to validate cart. Please try again.');
      },
    });
  });

  it('should refuse submitCheckout when form is invalid', () => {
    service.submitCheckout('http://localhost/return').subscribe({
      error: (err) => {
        expect(err.message).toBe('Form validation failed');
      },
    });
  });
});
