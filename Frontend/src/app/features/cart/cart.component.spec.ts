import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartComponent } from './cart.component';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/auth/auth.service';
import { Cart } from '../../core/models/cart.model';
import { CartStatus } from '../../core/models/cart-status.model';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let cartService: jasmine.SpyObj<CartService>;
  let router: jasmine.SpyObj<Router>;

  const mockCart: Cart = {
    id: 'cart-1',
    userId: 'user-1',
    status: CartStatus.Active,
    createdAt: '2024-01-01',
    lastUpdatedAt: '2024-01-01',
    items: [
      {
        productId: 'p1',
        productName: 'Product 1',
        slug: 'product-1',
        imageUrl: 'img.jpg',
        sellerId: 's1',
        sellerName: 'Seller',
        quantity: 2,
        unitPrice: 10,
        lineTotal: 20,
      },
    ],
    subtotal: 20,
    currency: 'USD',
    total: 20,
  };

  beforeEach(() => {
    cartService = jasmine.createSpyObj(
      'CartService',
      ['loadCart', 'addToCart', 'removeFromCart', 'updateQuantity', 'clearCart'],
      {
        cart: signal<Cart | null>(mockCart),
        loading: signal(false),
        error: signal<string | null>(null),
        isEmpty: signal(false),
        itemCount: signal(2),
        totalAmount: signal(20),
      },
    );

    const authService = jasmine.createSpyObj('AuthService', ['login'], {
      isLoggedIn: signal(false),
      authInitialized: signal(true),
    });

    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        { provide: CartService, useValue: cartService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).overrideComponent(CartComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose cart state from service', () => {
    expect((component as any).cart()).toEqual(mockCart);
    expect((component as any).loading()).toBe(false);
    expect((component as any).isEmpty()).toBe(false);
    expect((component as any).itemCount()).toBe(2);
    expect((component as any).totalAmount()).toBe(20);
  });

  it('should reload cart', () => {
    component.reload();
    expect(cartService.loadCart).toHaveBeenCalled();
  });

  it('should navigate to checkout', () => {
    component.checkout();
    expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
  });

  it('should navigate to products', () => {
    component.goToProducts();
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should update quantity via service', () => {
    component.updateQuantity('p1', 5);
    expect(cartService.updateQuantity).toHaveBeenCalledWith('p1', 5);
  });

  it('should remove item via service', () => {
    component.removeItem('p1');
    expect(cartService.removeFromCart).toHaveBeenCalledWith('p1');
  });

  it('should clear cart via service', () => {
    component.clearCart();
    expect(cartService.clearCart).toHaveBeenCalled();
  });
});
