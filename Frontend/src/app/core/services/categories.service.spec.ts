import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriesService } from './categories.service';
import { LoadingOverlayService } from './loading-overlay.service';
import { Category } from '../models/category.model';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: HttpTestingController;

  const mockCategories: Category[] = [
    {
      id: 'c1',
      name: 'Electronics',
      slug: 'electronics',
      featured: true,
      subcategoryIds: ['c2'],
      type: 'Category',
    },
    {
      id: 'c2',
      name: 'Phones',
      slug: 'phones',
      parentCategoryId: 'c1',
      subcategoryIds: [],
      type: 'Category',
    },
    {
      id: 'c3',
      name: 'Books',
      slug: 'books',
      featured: false,
      subcategoryIds: [],
      type: 'Category',
    },
  ];

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
    service = TestBed.inject(CategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should start with empty categories', () => {
    expect(service.categories()).toEqual([]);
    expect(service.loading()).toBe(false);
  });

  it('should load categories', () => {
    service.loadCategories();

    const req = httpMock.expectOne((r) => r.url.includes('/api/categories'));
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);

    expect(service.categories().length).toBe(3);
  });

  it('should not reload if categories already loaded', () => {
    service.loadCategories();
    httpMock.expectOne((r) => r.url.includes('/api/categories')).flush(mockCategories);

    service.loadCategories();
    httpMock.expectNone((r) => r.url.includes('/api/categories'));

    expect(service.categories().length).toBe(3);
  });

  it('should force reload categories', () => {
    service.loadCategories();
    httpMock.expectOne((r) => r.url.includes('/api/categories')).flush(mockCategories);

    service.reloadCategories();
    const req = httpMock.expectOne((r) => r.url.includes('/api/categories'));
    req.flush(mockCategories);

    expect(service.categories().length).toBe(3);
  });

  it('should build category tree', () => {
    service.loadCategories();
    httpMock.expectOne((r) => r.url.includes('/api/categories')).flush(mockCategories);

    const tree = service.categoryTree();
    expect(tree.length).toBe(2); // Electronics and Books at root
    const electronics = tree.find((n) => n.category.name === 'Electronics');
    expect(electronics!.children.length).toBe(1);
    expect(electronics!.children[0].category.name).toBe('Phones');
  });

  it('should compute featured categories', () => {
    service.loadCategories();
    httpMock.expectOne((r) => r.url.includes('/api/categories')).flush(mockCategories);

    const featured = service.featuredCategories();
    expect(featured.length).toBe(1);
    expect(featured[0].name).toBe('Electronics');
  });

  it('should get category by id', () => {
    service.loadCategories();
    httpMock.expectOne((r) => r.url.includes('/api/categories')).flush(mockCategories);

    expect(service.getCategoryById('c1')?.name).toBe('Electronics');
    expect(service.getCategoryById('nonexistent')).toBeUndefined();
  });

  it('should get category by slug', () => {
    service.loadCategories();
    httpMock.expectOne((r) => r.url.includes('/api/categories')).flush(mockCategories);

    expect(service.getCategoryBySlug('phones')?.id).toBe('c2');
  });

  it('should get category path', () => {
    service.loadCategories();
    httpMock.expectOne((r) => r.url.includes('/api/categories')).flush(mockCategories);

    const path = service.getCategoryPath('c2');
    expect(path.length).toBe(2);
    expect(path[0].name).toBe('Electronics');
    expect(path[1].name).toBe('Phones');
  });

  it('should build category URL', () => {
    service.loadCategories();
    httpMock.expectOne((r) => r.url.includes('/api/categories')).flush(mockCategories);

    expect(service.buildCategoryUrl('c2')).toBe('/category/electronics/phones');
  });

  it('should get available parent categories excluding descendants', () => {
    service.loadCategories();
    httpMock.expectOne((r) => r.url.includes('/api/categories')).flush(mockCategories);

    const available = service.getAvailableParentCategories('c1');
    expect(available.find((c) => c.id === 'c1')).toBeUndefined();
    expect(available.find((c) => c.id === 'c2')).toBeUndefined();
    expect(available.find((c) => c.id === 'c3')).toBeDefined();
  });

  it('should create a category', () => {
    service.createCategory({ name: 'New', slug: 'new' }).subscribe();

    const createReq = httpMock.expectOne((r) => r.url.includes('/api/admin/categories'));
    expect(createReq.request.method).toBe('POST');
    createReq.flush({ id: 'c-new', name: 'New', slug: 'new' });

    // Reload triggered
    httpMock.expectOne((r) => r.url.includes('/api/categories') && r.method === 'GET').flush([]);
  });

  it('should delete a category', () => {
    service.deleteCategory('c3').subscribe();

    const deleteReq = httpMock.expectOne((r) => r.url.includes('/api/admin/categories/c3'));
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);

    httpMock.expectOne((r) => r.url.includes('/api/categories') && r.method === 'GET').flush([]);
  });
});
