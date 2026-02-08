import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { OrderSuccessComponent } from './order-success.component';
import { OrderStateService } from '../../core/services/order-state.service';
import { Order } from '../../core/models/order.model';
import { OrderStatus } from '../../core/models/order-status.model';

describe('OrderSuccessComponent', () => {
  let component: OrderSuccessComponent;
  let fixture: ComponentFixture<OrderSuccessComponent>;
  let orderState: jasmine.SpyObj<OrderStateService>;
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

  function createComponent(order: Order | null): void {
    orderState = jasmine.createSpyObj('OrderStateService', ['clearLastOrder'], {
      order: signal(order),
    });
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [OrderSuccessComponent],
      providers: [
        { provide: OrderStateService, useValue: orderState },
        { provide: Router, useValue: router },
      ],
    }).overrideComponent(OrderSuccessComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(OrderSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent(mockOrder);
    expect(component).toBeTruthy();
  });

  it('should compute hasOrder as true when order exists', () => {
    createComponent(mockOrder);
    expect((component as any).hasOrder()).toBe(true);
  });

  it('should compute hasOrder as false when no order', () => {
    spyOn(console, 'warn');
    createComponent(null);
    expect((component as any).hasOrder()).toBe(false);
  });

  it('should redirect to products when no order on init', () => {
    spyOn(console, 'warn');
    createComponent(null);
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  it('should not redirect when order exists on init', () => {
    createComponent(mockOrder);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should clear order and navigate on continueShopping', () => {
    createComponent(mockOrder);
    component.continueShopping();
    expect(orderState.clearLastOrder).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });
});
