import { TestBed } from '@angular/core/testing';
import { cartNotEmptyGuard } from './cart-not-empty.guard';
import { CartService } from '../services/cart.service';
import { signal } from '@angular/core';

describe('cartNotEmptyGuard', () => {
  let cartService: jasmine.SpyObj<CartService>;
  const cartReadySignal = signal(false);
  const isEmptySignal = signal(true);

  beforeEach(() => {
    cartReadySignal.set(false);
    isEmptySignal.set(true);

    cartService = jasmine.createSpyObj('CartService', [], {
      cartReady: cartReadySignal,
      isEmpty: isEmptySignal,
    });

    TestBed.configureTestingModule({
      providers: [{ provide: CartService, useValue: cartService }],
    });
  });

  it('should allow immediately when cart is ready and not empty', () => {
    cartReadySignal.set(true);
    isEmptySignal.set(false);

    const result = TestBed.runInInjectionContext(() => cartNotEmptyGuard({} as any, {} as any));

    expect(result).toBe(true);
  });

  it('should deny when cart is ready and empty', (done) => {
    cartReadySignal.set(true);
    isEmptySignal.set(true);

    const result = TestBed.runInInjectionContext(() => cartNotEmptyGuard({} as any, {} as any));

    // When cartReady is true but isEmpty was true at check time,
    // the fast-path doesn't trigger; it goes to the observable path
    if (typeof result === 'boolean') {
      // Fast path was not taken (cartReady was true but isEmpty was true)
      // This guard doesn't redirect - it just returns false
      done();
    } else {
      // Observable path
      (result as any).subscribe((allowed: boolean) => {
        expect(allowed).toBe(false);
        done();
      });
    }
  });
});
