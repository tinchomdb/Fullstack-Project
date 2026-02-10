import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CheckoutComponent } from './checkout.component';
import { CheckoutService } from '../../core/services/checkout.service';
import { Order } from '../../core/models/order.model';
import { OrderStatus } from '../../core/models/order-status.model';

describe('CheckoutComponent', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;
  let checkoutService: jasmine.SpyObj<CheckoutService>;
  let router: jasmine.SpyObj<Router>;

  const mockOrder: Order = {
    id: 'order-1',
    userId: 'user-1',
    orderDate: '2024-01-01',
    status: OrderStatus.Pending,
    items: [],
    subtotal: 50,
    shippingCost: 5.99,
    total: 55.99,
    currency: 'USD',
  };

  beforeEach(() => {
    checkoutService = jasmine.createSpyObj('CheckoutService', ['submitCheckout', 'reset']);
    checkoutService.submitCheckout.and.returnValue(of(mockOrder));

    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        { provide: CheckoutService, useValue: checkoutService },
        { provide: Router, useValue: router },
      ],
    }).overrideComponent(CheckoutComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to order-success on successful checkout', () => {
    component.processCheckout();
    expect(checkoutService.submitCheckout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/order-success']);
  });

  it('should pass return URL to submitCheckout', () => {
    component.processCheckout();
    const url = checkoutService.submitCheckout.calls.mostRecent().args[0];
    expect(url).toContain('/order-success');
  });

  it('should log error on checkout failure', () => {
    spyOn(console, 'error');
    checkoutService.submitCheckout.and.returnValue(throwError(() => new Error('Payment failed')));
    component.processCheckout();
    expect(console.error).toHaveBeenCalledWith('Checkout failed:', jasmine.any(Error));
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to cart on goBackToCart', () => {
    component.goBackToCart();
    expect(router.navigate).toHaveBeenCalledWith(['/cart']);
  });

  it('should call checkout.reset on destroy', () => {
    component.ngOnDestroy();
    expect(checkoutService.reset).toHaveBeenCalled();
  });
});
