import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { OrderSummaryPanelComponent } from './order-summary-panel.component';
import { Cart } from '../../../core/models/cart.model';
import { CartStatus } from '../../../core/models/cart-status.model';

const mockCart: Cart = {
  id: 'c1',
  userId: 'u1',
  status: CartStatus.Active,
  createdAt: '',
  lastUpdatedAt: '',
  items: [
    {
      productId: 'p1',
      productName: 'A',
      slug: 'a',
      imageUrl: '',
      sellerId: 's1',
      sellerName: 'S',
      quantity: 2,
      unitPrice: 10,
      lineTotal: 20,
    },
    {
      productId: 'p2',
      productName: 'B',
      slug: 'b',
      imageUrl: '',
      sellerId: 's1',
      sellerName: 'S',
      quantity: 1,
      unitPrice: 30,
      lineTotal: 30,
    },
  ],
  subtotal: 50,
  currency: 'USD',
  total: 50,
};

@Component({
  template: `<app-order-summary-panel
    [cart]="cart()"
    [additionalCost]="additionalCost"
    [ctaDisabled]="ctaDisabled"
    (ctaClick)="onCta()"
    (secondaryCtaClick)="onSecondary()"
  />`,
  imports: [OrderSummaryPanelComponent],
})
class TestHostComponent {
  cart = signal<Cart | null>(mockCart);
  additionalCost = 5.99;
  ctaDisabled = false;
  ctaCalled = false;
  secondaryCalled = false;
  onCta(): void {
    this.ctaCalled = true;
  }
  onSecondary(): void {
    this.secondaryCalled = true;
  }
}

describe('OrderSummaryPanelComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getComponent(): OrderSummaryPanelComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getComponent()).toBeTruthy();
  });

  it('should compute itemCount from cart items', () => {
    expect(getComponent()['itemCount']()).toBe(3);
  });

  it('should compute finalTotal as cart.total + additionalCost', () => {
    expect(getComponent()['finalTotal']()).toBeCloseTo(55.99);
  });

  it('should return 0 itemCount when cart is null', () => {
    host.cart.set(null);
    fixture.detectChanges();
    expect(getComponent()['itemCount']()).toBe(0);
  });

  it('should return 0 finalTotal when cart is null', () => {
    host.cart.set(null);
    fixture.detectChanges();
    expect(getComponent()['finalTotal']()).toBe(0);
  });

  it('should emit ctaClick when not disabled', () => {
    getComponent().onCtaClick();
    expect(host.ctaCalled).toBeTrue();
  });

  it('should not emit ctaClick when disabled', () => {
    host.ctaDisabled = true;
    fixture.detectChanges();
    getComponent().onCtaClick();
    expect(host.ctaCalled).toBeFalse();
  });

  it('should emit secondaryCtaClick', () => {
    getComponent().onSecondaryCtaClick();
    expect(host.secondaryCalled).toBeTrue();
  });
});
