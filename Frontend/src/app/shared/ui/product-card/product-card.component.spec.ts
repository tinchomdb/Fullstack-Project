import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProductCardComponent } from './product-card.component';
import { CartService } from '../../../core/services/cart.service';
import { ProductsService } from '../../../core/services/products.service';
import { Product } from '../../../core/models/product.model';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';

const mockProduct: Product = {
  id: 'p1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product',
  price: 29.99,
  currency: 'USD',
  stock: 10,
  imageUrls: ['img1.jpg'],
  categoryIds: ['c1'],
  sellerId: 's1',
  seller: { id: 's1', displayName: 'Test Seller', email: 'seller@test.com' },
  featured: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

@Component({
  template: `<app-product-card [product]="product" />`,
  imports: [ProductCardComponent],
})
class TestHostComponent {
  product = mockProduct;
}

describe('ProductCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let cartSpy: jasmine.SpyObj<CartService>;
  let productsSpy: jasmine.SpyObj<ProductsService>;

  beforeEach(async () => {
    cartSpy = jasmine.createSpyObj('CartService', ['addToCart'], {
      loading: signal(false),
    });
    productsSpy = jasmine.createSpyObj('ProductsService', ['buildProductUrl']);
    productsSpy.buildProductUrl.and.returnValue('/product/test-product');

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartSpy },
        { provide: ProductsService, useValue: productsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  function getComponent(): ProductCardComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getComponent()).toBeTruthy();
  });

  it('should compute product link', () => {
    expect(getComponent()['productLink']()).toBe('/product/test-product');
  });

  it('should not be adding to cart initially', () => {
    expect(getComponent()['isAddingToCart']()).toBeFalse();
  });

  it('should add to cart on onAddToCart', () => {
    getComponent().onAddToCart();
    expect(cartSpy.addToCart).toHaveBeenCalledWith(mockProduct, 1);
  });
});
