import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaymentApiService, CreatePaymentIntentRequest } from './payment-api.service';

describe('PaymentApiService', () => {
  let service: PaymentApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create a payment intent', () => {
    const request: CreatePaymentIntentRequest = {
      amount: 1000,
      email: 'test@example.com',
      cartId: 'cart-1',
      shippingCost: 5.99,
    };

    service.createPaymentIntent(request).subscribe((response) => {
      expect(response.clientSecret).toBe('cs_test_123');
      expect(response.amount).toBe(1000);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/create-intent'));
    expect(req.request.method).toBe('POST');
    req.flush({ clientSecret: 'cs_test_123', amount: 1000 });
  });
});
