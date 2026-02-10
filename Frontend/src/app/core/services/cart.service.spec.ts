import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CartService } from './cart.service';
import { AuthService } from '../auth/auth.service';
import { GuestAuthService } from '../auth/guest-auth.service';
import { LoadingOverlayService } from './loading-overlay.service';
import { AlertService } from './alert.service';
import { CartApiService } from './cart-api.service';
import { OrderStateService } from './order-state.service';
import { Cart } from '../models/cart.model';
import { CartStatus } from '../models/cart-status.model';
import { Product } from '../models/product.model';

describe('CartService', () => {
  let service: CartService;
  let cartApiSpy: jasmine.SpyObj<CartApiService>;
  let orderStateSpy: jasmine.SpyObj<OrderStateService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let authIsLoggedIn: ReturnType<typeof signal<boolean>>;
  let authInitialized: ReturnType<typeof signal<boolean>>;
  let guestHasToken: ReturnType<typeof signal<boolean>>;

  const mockCart: Cart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        productId: 'p1',
        productName: 'Product 1',
        slug: 'product-1',
        imageUrl: 'img.jpg',
        quantity: 2,
        unitPrice: 10,
        lineTotal: 20,
        sellerId: 's1',
        sellerName: 'Seller 1',
      },
    ],
    subtotal: 20,
    total: 20,
    currency: 'USD',
    status: CartStatus.Active,
    createdAt: '2024-01-01',
    lastUpdatedAt: '2024-01-01',
  };

  beforeEach(() => {
    authIsLoggedIn = signal(false);
    authInitialized = signal(false);
    guestHasToken = signal(false);

    cartApiSpy = jasmine.createSpyObj('CartApiService', [
      'getActiveCart',
      'addToCart',
      'removeFromCart',
      'updateQuantity',
      'clearCart',
      'checkout',
      'validateCheckout',
      'migrateGuestCart',
    ]);
    cartApiSpy.getActiveCart.and.returnValue(of(mockCart));
    cartApiSpy.migrateGuestCart.and.returnValue(of({ message: 'ok' }));

    orderStateSpy = jasmine.createSpyObj('OrderStateService', ['setLastOrder']);
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['show']);

    TestBed.configureTestingModule({
      providers: [
        CartService,
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: authIsLoggedIn,
            isAdmin: signal(false),
            authInitialized,
            userId: signal('user-1'),
          },
        },
        {
          provide: GuestAuthService,
          useValue: {
            hasToken: guestHasToken,
            clearToken: jasmine.createSpy('clearToken'),
          },
        },
        { provide: CartApiService, useValue: cartApiSpy },
        { provide: OrderStateService, useValue: orderStateSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        {
          provide: LoadingOverlayService,
          useValue: { show: jasmine.createSpy(), hide: jasmine.createSpy() },
        },
      ],
    });

    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have null initial cart', () => {
    expect(service.cart()).toBeNull();
  });

  it('should compute itemCount from cart items', () => {
    expect(service.itemCount()).toBe(0);
  });

  it('should compute isEmpty as true when no cart', () => {
    expect(service.isEmpty()).toBeTrue();
  });

  it('should load cart', () => {
    service.loadCart();
    expect(cartApiSpy.getActiveCart).toHaveBeenCalled();
  });

  it('should add product to cart', () => {
    cartApiSpy.addToCart.and.returnValue(of(mockCart));
    const product = { id: 'p1', seller: { id: 's1' } } as Product;

    service.addToCart(product, 2);
    expect(cartApiSpy.addToCart).toHaveBeenCalledWith({
      productId: 'p1',
      sellerId: 's1',
      quantity: 2,
    });
  });

  it('should remove product from cart', () => {
    cartApiSpy.removeFromCart.and.returnValue(of(mockCart));
    service.removeFromCart('p1');
    expect(cartApiSpy.removeFromCart).toHaveBeenCalledWith('p1');
  });

  it('should clear cart', () => {
    cartApiSpy.clearCart.and.returnValue(of(mockCart));
    service.clearCart();
    expect(cartApiSpy.clearCart).toHaveBeenCalled();
  });

  it('should throw on checkout without cart', () => {
    expect(() => service.checkout()).toThrowError('No active cart to checkout');
  });

  it('should throw on validateCheckout without cart', () => {
    expect(() => service.validateCheckout()).toThrowError('No active cart to validate');
  });

  it('should set cartReady to true after loadCart succeeds', () => {
    service.loadCart();
    expect(service.cartReady()).toBeTrue();
  });

  it('should show alert when addToCart gets 409 insufficient stock', () => {
    const errorResponse = new HttpErrorResponse({
      status: 409,
      error: { error: 'Insufficient stock', requestedQuantity: 10, availableStock: 5 },
    });
    cartApiSpy.addToCart.and.returnValue(throwError(() => errorResponse));
    const product = { id: 'p1', seller: { id: 's1' } } as Product;

    service.addToCart(product, 10);

    expect(alertServiceSpy.show).toHaveBeenCalledWith(
      'Not enough stock available. Only 5 item(s) in stock.',
    );
  });

  it('should show alert when updateQuantity gets 409 insufficient stock', () => {
    // First load a cart so updateQuantity can find the item
    cartApiSpy.getActiveCart.and.returnValue(of(mockCart));
    service.loadCart();

    const errorResponse = new HttpErrorResponse({
      status: 409,
      error: { error: 'Insufficient stock', requestedQuantity: 10, availableStock: 2 },
    });
    cartApiSpy.updateQuantity.and.returnValue(throwError(() => errorResponse));

    service.updateQuantity('p1', 10);

    expect(alertServiceSpy.show).toHaveBeenCalledWith(
      'Not enough stock available. Only 2 item(s) in stock.',
    );
  });

  it('should not show alert for non-409 errors', () => {
    const errorResponse = new HttpErrorResponse({ status: 500 });
    cartApiSpy.addToCart.and.returnValue(throwError(() => errorResponse));
    const product = { id: 'p1', seller: { id: 's1' } } as Product;

    service.addToCart(product, 1);

    expect(alertServiceSpy.show).not.toHaveBeenCalled();
  });
});
