import { parsePrice, parseSort, parseCommonFilters, createBaseFilters } from './query-params.util';

describe('query-params.util', () => {
  describe('parsePrice', () => {
    it('should parse valid price string', () => {
      expect(parsePrice('29.99')).toBe(29.99);
    });

    it('should parse zero', () => {
      expect(parsePrice('0')).toBe(0);
    });

    it('should return undefined for negative price', () => {
      expect(parsePrice('-5')).toBeUndefined();
    });

    it('should return undefined for non-string', () => {
      expect(parsePrice(42)).toBeUndefined();
      expect(parsePrice(null)).toBeUndefined();
      expect(parsePrice(undefined)).toBeUndefined();
    });

    it('should return undefined for non-numeric string', () => {
      expect(parsePrice('abc')).toBeUndefined();
    });

    it('should return undefined for NaN result', () => {
      expect(parsePrice('not-a-number')).toBeUndefined();
    });
  });

  describe('parseSort', () => {
    it('should parse valid sort params', () => {
      const result = parseSort({ sortBy: 'name', sortDirection: 'asc' });
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });

    it('should parse price desc sort', () => {
      const result = parseSort({ sortBy: 'price', sortDirection: 'desc' });
      expect(result.sortBy).toBe('price');
      expect(result.sortDirection).toBe('desc');
    });

    it('should return defaults for invalid sortBy', () => {
      const result = parseSort({ sortBy: 'invalid', sortDirection: 'asc' });
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });

    it('should return defaults for invalid sortDirection', () => {
      const result = parseSort({ sortBy: 'name', sortDirection: 'invalid' });
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });

    it('should return defaults for empty params', () => {
      const result = parseSort({});
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });
  });

  describe('parseCommonFilters', () => {
    it('should parse sort from params', () => {
      const result = parseCommonFilters({ sortBy: 'price', sortDirection: 'desc' });
      expect(result.sortBy).toBe('price');
      expect(result.sortDirection).toBe('desc');
    });

    it('should use defaults for empty params', () => {
      const result = parseCommonFilters({});
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });
  });

  describe('createBaseFilters', () => {
    it('should create filters with default page size of 20', () => {
      const result = createBaseFilters();
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.sortBy).toBe('name');
      expect(result.sortDirection).toBe('asc');
    });

    it('should accept custom page size', () => {
      const result = createBaseFilters(10);
      expect(result.pageSize).toBe(10);
    });
  });
});
