import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { CartApiService } from './cart-api.service';
import { AuthService } from '../auth/auth.service';
import { GuestAuthService } from '../auth/guest-auth.service';

describe('CartApiService', () => {
  let service: CartApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { isLoggedIn: signal(false) },
        },
        {
          provide: GuestAuthService,
          useValue: {
            requestGuestSessionId: () => 'guest-session-123',
            hasToken: signal(true),
          },
        },
      ],
    });
    service = TestBed.inject(CartApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should use guest endpoint when not logged in', () => {
    service.getActiveCart().subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/guest-cart'));
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('should use my-cart endpoint when logged in', () => {
    const authService = TestBed.inject(AuthService) as any;
    (authService.isLoggedIn as ReturnType<typeof signal>).set(true);

    service.getActiveCart().subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/my-cart'));
    expect(req.request.method).toBe('GET');
    req.flush(null);
  });

  it('should add to cart', () => {
    service.addToCart({ productId: 'p1', sellerId: 's1', quantity: 2 }).subscribe((cart) => {
      expect(cart.id).toBe('cart-1');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/items'));
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 'cart-1',
      userId: 'u1',
      status: 'Active',
      items: [],
      subtotal: 0,
      total: 0,
    });
  });

  it('should remove from cart', () => {
    service.removeFromCart('p1').subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/items/p1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ id: 'cart-1', status: 'Active', items: [], subtotal: 0, total: 0 });
  });

  it('should update quantity', () => {
    service.updateQuantity({ productId: 'p1', sellerId: 's1', quantity: 5 }).subscribe();
    const req = httpMock.expectOne((r) => r.url.includes('/items/p1'));
    expect(req.request.method).toBe('PATCH');
    req.flush({ id: 'cart-1', status: 'Active', items: [], subtotal: 0, total: 0 });
  });

  it('should checkout', () => {
    const authService = TestBed.inject(AuthService) as any;
    (authService.isLoggedIn as ReturnType<typeof signal>).set(true);

    service.checkout({ cartId: 'cart-1', shippingCost: 5 }).subscribe((order) => {
      expect(order.id).toBe('ord-1');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/my-cart/checkout'));
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'ord-1', userId: 'u1', status: 'Pending', items: [] });
  });

  it('should validate checkout', () => {
    const authService = TestBed.inject(AuthService) as any;
    (authService.isLoggedIn as ReturnType<typeof signal>).set(true);

    service.validateCheckout().subscribe((response) => {
      expect(response.isValid).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/validate-checkout'));
    expect(req.request.method).toBe('POST');
    req.flush({ isValid: true, cartId: 'cart-1', subtotal: 100, total: 105, warnings: [] });
  });

  it('should migrate guest cart', () => {
    service.migrateGuestCart().subscribe((response) => {
      expect(response.message).toBe('Migrated');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/migrate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.guestSessionId).toBe('guest-session-123');
    req.flush({ message: 'Migrated' });
  });
});
