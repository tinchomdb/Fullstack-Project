import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProductDetailComponent } from './product-detail.component';
import { ProductsService } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { Product } from '../../core/models/product.model';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;
  let productsService: jasmine.SpyObj<ProductsService>;
  let cartService: jasmine.SpyObj<CartService>;
  let breadcrumbService: jasmine.SpyObj<BreadcrumbService>;
  let router: jasmine.SpyObj<Router>;

  const mockProduct: Product = {
    id: 'p1',
    slug: 'test-product',
    name: 'Test Product',
    description: 'A test product',
    price: 29.99,
    currency: 'USD',
    stock: 10,
    sellerId: 's1',
    categoryIds: ['cat-1'],
    seller: { id: 's1', displayName: 'Seller', email: 's@e.com', companyName: null },
    imageUrls: ['img1.jpg'],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    url: '/products/test-product',
  };

  beforeEach(() => {
    productsService = jasmine.createSpyObj('ProductsService', ['getProductBySlug']);
    cartService = jasmine.createSpyObj('CartService', ['addToCart']);
    breadcrumbService = jasmine.createSpyObj('BreadcrumbService', [
      'updateBreadcrumbsForProductDetailsPage',
    ]);
    router = jasmine.createSpyObj('Router', ['navigate']);

    productsService.getProductBySlug.and.returnValue(of(mockProduct));

    TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        { provide: ProductsService, useValue: productsService },
        { provide: CartService, useValue: cartService },
        { provide: BreadcrumbService, useValue: breadcrumbService },
        { provide: Router, useValue: router },
      ],
    }).overrideComponent(ProductDetailComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('slug', 'test-product');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product on slug input', () => {
    expect(productsService.getProductBySlug).toHaveBeenCalledWith('test-product');
  });

  it('should set product after loading', () => {
    expect((component as any).product()).toEqual(mockProduct);
    expect((component as any).loading()).toBe(false);
  });

  it('should update breadcrumbs after loading', () => {
    expect(breadcrumbService.updateBreadcrumbsForProductDetailsPage).toHaveBeenCalledWith(
      'Test Product',
      'cat-1',
    );
  });

  it('should set error on load failure', () => {
    spyOn(console, 'error');
    productsService.getProductBySlug.and.returnValue(throwError(() => new Error('Not found')));
    fixture.componentRef.setInput('slug', 'bad-slug');
    fixture.detectChanges();

    expect((component as any).error()).toBe('Failed to load product. Please try again.');
    expect((component as any).loading()).toBe(false);
  });

  it('should update quantity', () => {
    (component as any).onQuantityChange(5);
    expect((component as any).quantity()).toBe(5);
  });

  it('should add product to cart', fakeAsync(() => {
    (component as any).addToCart();
    expect(cartService.addToCart).toHaveBeenCalledWith(mockProduct, 1);
    expect((component as any).addingToCart()).toBe(true);

    tick(500);
    expect((component as any).addingToCart()).toBe(false);
  }));

  it('should not add to cart when no product', () => {
    (component as any).product.set(null);
    (component as any).addToCart();
    expect(cartService.addToCart).not.toHaveBeenCalled();
  });

  it('should buy now and navigate to cart', fakeAsync(() => {
    (component as any).buyNow();
    expect(cartService.addToCart).toHaveBeenCalledWith(mockProduct, 1);

    tick(600);
    expect(router.navigate).toHaveBeenCalledWith(['/cart']);
  }));
});
