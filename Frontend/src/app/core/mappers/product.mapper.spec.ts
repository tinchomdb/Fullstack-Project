import { mapProductFromApi, mapSellerFromApi, mapProductToApi } from './product.mapper';
import { ProductApiModel } from '../models/api/product-api.model';

describe('product.mapper', () => {
  describe('mapProductFromApi', () => {
    it('should map a fully populated API model', () => {
      const dto: ProductApiModel = {
        id: 'p1',
        slug: 'test-product',
        name: 'Test Product',
        description: 'A great product',
        price: 29.99,
        currency: 'EUR',
        stock: 10,
        sellerId: 's1',
        categoryIds: ['c1', 'c2'],
        seller: { id: 's1', displayName: 'Acme', companyName: 'Acme Inc.', email: 'a@b.com' },
        imageUrls: ['https://img.com/1.jpg', 'https://img.com/2.jpg'],
        featured: true,
        createdAt: '2025-01-01',
        updatedAt: '2025-06-01',
      };

      const result = mapProductFromApi(dto);

      expect(result.id).toBe('p1');
      expect(result.slug).toBe('test-product');
      expect(result.name).toBe('Test Product');
      expect(result.description).toBe('A great product');
      expect(result.price).toBe(29.99);
      expect(result.currency).toBe('EUR');
      expect(result.sellerId).toBe('s1');
      expect(result.categoryIds).toEqual(['c1', 'c2']);
      expect(result.seller.id).toBe('s1');
      expect(result.seller.displayName).toBe('Acme');
      expect(result.imageUrls).toEqual(['https://img.com/1.jpg', 'https://img.com/2.jpg']);
      expect(result.featured).toBe(true);
      expect(result.createdAt).toBe('2025-01-01');
      expect(result.updatedAt).toBe('2025-06-01');
    });

    it('should apply defaults for missing fields', () => {
      const dto: ProductApiModel = {};

      const result = mapProductFromApi(dto);

      expect(result.id).toBe('');
      expect(result.slug).toBe('');
      expect(result.name).toBe('Unnamed product');
      expect(result.description).toBe('No description available.');
      expect(result.price).toBe(0);
      expect(result.currency).toBe('USD');
      expect(result.sellerId).toBe('');
      expect(result.categoryIds).toEqual([]);
      expect(result.imageUrls).toEqual([]);
      expect(result.featured).toBe(false);
    });

    it('should filter out invalid image URLs', () => {
      const dto: ProductApiModel = {
        imageUrls: ['https://valid.com/img.jpg', '', '   ', 'https://also-valid.com/img.png'],
      };

      const result = mapProductFromApi(dto);

      expect(result.imageUrls).toEqual([
        'https://valid.com/img.jpg',
        'https://also-valid.com/img.png',
      ]);
    });

    it('should handle null imageUrls', () => {
      const dto: ProductApiModel = { imageUrls: null };
      const result = mapProductFromApi(dto);
      expect(result.imageUrls).toEqual([]);
    });

    it('should handle empty categoryIds', () => {
      const dto: ProductApiModel = { categoryIds: [] };
      const result = mapProductFromApi(dto);
      expect(result.categoryIds).toEqual([]);
    });

    it('should handle null seller', () => {
      const dto: ProductApiModel = { seller: null, sellerId: 'fallback-id' };
      const result = mapProductFromApi(dto);
      expect(result.seller.id).toBe('fallback-id');
      expect(result.seller.displayName).toBe('Unknown seller');
    });
  });

  describe('mapSellerFromApi', () => {
    it('should map seller with all fields', () => {
      const result = mapSellerFromApi({
        id: 's1',
        displayName: 'Shop',
        companyName: 'Shop LLC',
        email: 'shop@example.com',
      });
      expect(result).toEqual({
        id: 's1',
        displayName: 'Shop',
        companyName: 'Shop LLC',
        email: 'shop@example.com',
      });
    });

    it('should use fallback ID when seller is null', () => {
      const result = mapSellerFromApi(null, 'fallback');
      expect(result.id).toBe('fallback');
      expect(result.displayName).toBe('Unknown seller');
    });

    it('should use fallback ID when seller is undefined', () => {
      const result = mapSellerFromApi(undefined, 'fb');
      expect(result.id).toBe('fb');
    });
  });

  describe('mapProductToApi', () => {
    it('should reverse-map a product to API model', () => {
      const product = {
        id: 'p1',
        slug: 'test',
        name: 'Test',
        description: 'Desc',
        price: 10,
        currency: 'USD',
        stock: 5,
        sellerId: 's1',
        categoryIds: ['c1'] as readonly string[],
        seller: { id: 's1', displayName: 'Seller', companyName: null, email: '' },
        imageUrls: ['img.jpg'] as readonly string[],
        featured: false,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-02',
        url: '/products/test',
      };

      const result = mapProductToApi(product);

      expect(result.id).toBe('p1');
      expect(result.name).toBe('Test');
      expect(result.type).toBe('Product');
      expect(result.stock).toBe(5);
    });

    it('should default stock to 0 when undefined', () => {
      const product = {
        id: '',
        slug: '',
        name: '',
        description: '',
        price: 0,
        currency: 'USD',
        sellerId: '',
        categoryIds: [] as readonly string[],
        seller: { id: '', displayName: '', companyName: null, email: '' },
        imageUrls: [] as readonly string[],
        featured: false,
        createdAt: '',
        updatedAt: '',
        url: '',
      };

      const result = mapProductToApi(product);
      expect(result.stock).toBe(0);
    });
  });
});
