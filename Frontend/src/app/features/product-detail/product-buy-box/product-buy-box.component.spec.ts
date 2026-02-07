import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductBuyBoxComponent } from './product-buy-box.component';
import { Product } from '../../../core/models/product.model';

describe('ProductBuyBoxComponent', () => {
  let component: ProductBuyBoxComponent;
  let fixture: ComponentFixture<ProductBuyBoxComponent>;

  const baseProduct: Product = {
    id: 'p1',
    slug: 'test',
    name: 'Test',
    description: 'Desc',
    price: 49.99,
    currency: 'USD',
    stock: 10,
    sellerId: 's1',
    categoryIds: [],
    seller: { id: 's1', displayName: 'Seller', email: 's@e.com', companyName: null },
    imageUrls: [],
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductBuyBoxComponent],
    }).overrideComponent(ProductBuyBoxComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(ProductBuyBoxComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', baseProduct);
    fixture.componentRef.setInput('quantity', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('inStock computed', () => {
    it('should return true when stock > 0', () => {
      expect((component as any).inStock()).toBe(true);
    });

    it('should return false when stock is 0', () => {
      fixture.componentRef.setInput('product', { ...baseProduct, stock: 0 });
      fixture.detectChanges();
      expect((component as any).inStock()).toBe(false);
    });

    it('should return true when stock is undefined', () => {
      const { stock, ...rest } = baseProduct;
      fixture.componentRef.setInput('product', rest);
      fixture.detectChanges();
      expect((component as any).inStock()).toBe(true);
    });
  });

  describe('stockText computed', () => {
    it('should return "In Stock" when stock >= 10', () => {
      expect((component as any).stockText()).toBe('In Stock');
    });

    it('should return "Out of Stock" when stock is 0', () => {
      fixture.componentRef.setInput('product', { ...baseProduct, stock: 0 });
      fixture.detectChanges();
      expect((component as any).stockText()).toBe('Out of Stock');
    });

    it('should return low stock message when stock < 10', () => {
      fixture.componentRef.setInput('product', { ...baseProduct, stock: 5 });
      fixture.detectChanges();
      expect((component as any).stockText()).toBe('Only 5 left in stock');
    });

    it('should return "In Stock" when stock is undefined', () => {
      const { stock, ...rest } = baseProduct;
      fixture.componentRef.setInput('product', rest);
      fixture.detectChanges();
      expect((component as any).stockText()).toBe('In Stock');
    });
  });

  describe('priceFormatted computed', () => {
    it('should format price as USD', () => {
      const formatted = (component as any).priceFormatted();
      expect(formatted).toContain('49.99');
    });

    it('should use product currency', () => {
      fixture.componentRef.setInput('product', { ...baseProduct, price: 100, currency: 'EUR' });
      fixture.detectChanges();
      const formatted = (component as any).priceFormatted();
      expect(formatted).toContain('100');
    });
  });

  describe('outputs', () => {
    it('should emit quantityChange', () => {
      spyOn(component.quantityChange, 'emit');
      (component as any).onQuantityChange(3);
      expect(component.quantityChange.emit).toHaveBeenCalledWith(3);
    });

    it('should emit addToCart', () => {
      spyOn(component.addToCart, 'emit');
      (component as any).onAddToCart();
      expect(component.addToCart.emit).toHaveBeenCalled();
    });

    it('should emit buyNow', () => {
      spyOn(component.buyNow, 'emit');
      (component as any).onBuyNow();
      expect(component.buyNow.emit).toHaveBeenCalled();
    });
  });
});
