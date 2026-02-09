import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ProductCardComponent } from './product-card.component';
import { Product } from '../../../core/models/product.model';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';

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
  url: '/products/test-product',
};

@Component({
  template: `<app-product-card
    [product]="product"
    [productLink]="productLink"
    (addToCart)="onAddToCart($event)"
  />`,
  imports: [ProductCardComponent],
})
class TestHostComponent {
  product = mockProduct;
  productLink = '/products/test-product';
  addedProduct: Product | null = null;

  onAddToCart(product: Product): void {
    this.addedProduct = product;
  }
}

describe('ProductCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        {
          provide: IMAGE_LOADER,
          useValue: (config: ImageLoaderConfig) =>
            `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7`,
        },
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

  it('should use product link from input', () => {
    expect(getComponent().productLink()).toBe('/products/test-product');
  });

  it('should not be adding to cart initially', () => {
    expect(getComponent()['isAddingToCart']()).toBeFalse();
  });

  it('should emit addToCart on onAddToCart', () => {
    getComponent().onAddToCart();
    expect(fixture.componentInstance.addedProduct).toEqual(mockProduct);
  });
});
