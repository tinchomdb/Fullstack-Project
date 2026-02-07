import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductsService } from './products.service';
import { LoadingOverlayService } from './loading-overlay.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: LoadingOverlayService,
          useValue: { show: jasmine.createSpy('show'), hide: jasmine.createSpy('hide') },
        },
      ],
    });
    service = TestBed.inject(ProductsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should start with empty products', () => {
    expect(service.products()).toEqual([]);
    expect(service.loading()).toBe(false);
    expect(service.hasData()).toBe(false);
  });

  it('should load products with filters', () => {
    service.loadProducts({ page: 1, pageSize: 10, sortBy: 'name', sortDirection: 'asc' });

    const req = httpMock.expectOne((r) => r.url.includes('/api/products'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('pageSize')).toBe('10');
    expect(req.request.params.get('sortBy')).toBe('name');

    req.flush({
      items: [
        {
          id: 'p1',
          slug: 'test',
          name: 'Test Product',
          price: 10,
          sellerId: 's1',
          seller: { id: 's1', displayName: 'Seller' },
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    expect(service.products().length).toBe(1);
    expect(service.products()[0].name).toBe('Test Product');
  });

  it('should load featured products', () => {
    service.loadFeaturedProducts('cat-1', 5);

    const req = httpMock.expectOne((r) => r.url.includes('/api/products/featured'));
    expect(req.request.params.get('categoryId')).toBe('cat-1');
    expect(req.request.params.get('limit')).toBe('5');
    req.flush([
      {
        id: 'fp1',
        name: 'Featured',
        slug: 'featured',
        price: 20,
        sellerId: 's1',
        seller: { id: 's1', displayName: 'Seller' },
        featured: true,
      },
    ]);

    expect(service.featuredProducts().length).toBe(1);
    expect(service.featuredProducts()[0].featured).toBe(true);
  });

  it('should get product by slug', () => {
    service.getProductBySlug('test-slug').subscribe((product) => {
      expect(product.slug).toBe('test-slug');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/by-slug/test-slug'));
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 'p1',
      slug: 'test-slug',
      name: 'Test',
      sellerId: 's1',
      seller: { id: 's1', displayName: 'Seller' },
    });
  });

  it('should create a product via admin endpoint', () => {
    service.createProduct({ name: 'New', price: 50 } as any).subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/api/admin/products'));
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 'p-new',
      name: 'New',
      slug: 'new',
      price: 50,
      sellerId: 's1',
      seller: { id: 's1', displayName: 'Seller' },
    });

    // After mutation, reloadProducts triggers a new GET
    const reloadReq = httpMock.expectOne(
      (r) => r.url.includes('/api/products') && r.method === 'GET',
    );
    reloadReq.flush({ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });
  });

  it('should delete a product via admin endpoint', () => {
    service.deleteProduct('p1', 's1').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/api/admin/products/p1/seller/s1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    const reloadReq = httpMock.expectOne(
      (r) => r.url.includes('/api/products') && r.method === 'GET',
    );
    reloadReq.flush({ items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 });
  });

  it('should build product URL', () => {
    const product = {
      slug: 'my-product',
    } as any;
    expect(service.buildProductUrl(product)).toBe('/products/my-product');
  });
});
