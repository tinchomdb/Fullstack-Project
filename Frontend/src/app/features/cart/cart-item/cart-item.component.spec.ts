import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CartItemComponent } from './cart-item.component';
import { CartItem } from '../../../core/models/cart-item.model';

describe('CartItemComponent', () => {
  let component: CartItemComponent;
  let fixture: ComponentFixture<CartItemComponent>;
  let router: jasmine.SpyObj<Router>;

  const mockItem: CartItem = {
    productId: 'p1',
    productName: 'Widget',
    slug: 'widget',
    imageUrl: 'widget.jpg',
    sellerId: 's1',
    sellerName: 'Seller',
    quantity: 2,
    unitPrice: 15,
    lineTotal: 30,
  };

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [CartItemComponent],
      providers: [{ provide: Router, useValue: router }],
    }).overrideComponent(CartItemComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(CartItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', mockItem);
    fixture.componentRef.setInput('currency', 'USD');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit increase', () => {
    spyOn(component.increase, 'emit');
    component.onIncrease();
    expect(component.increase.emit).toHaveBeenCalled();
  });

  it('should emit decrease', () => {
    spyOn(component.decrease, 'emit');
    component.onDecrease();
    expect(component.decrease.emit).toHaveBeenCalled();
  });

  it('should emit remove', () => {
    spyOn(component.remove, 'emit');
    component.onRemove();
    expect(component.remove.emit).toHaveBeenCalled();
  });

  it('should navigate to product on link click', () => {
    component.onLinkClick();
    expect(router.navigate).toHaveBeenCalledWith(['/products', 'widget']);
  });
});
