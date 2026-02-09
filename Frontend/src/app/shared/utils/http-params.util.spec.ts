import { buildHttpParams } from './http-params.util';

describe('buildHttpParams', () => {
  it('should create empty params from empty object', () => {
    const params = buildHttpParams({});
    expect(params.keys().length).toBe(0);
  });

  it('should include string values', () => {
    const params = buildHttpParams({ name: 'test', category: 'books' });
    expect(params.get('name')).toBe('test');
    expect(params.get('category')).toBe('books');
  });

  it('should include number values as strings', () => {
    const params = buildHttpParams({ page: 1, pageSize: 20 });
    expect(params.get('page')).toBe('1');
    expect(params.get('pageSize')).toBe('20');
  });

  it('should include boolean values as strings', () => {
    const params = buildHttpParams({ active: true, deleted: false });
    expect(params.get('active')).toBe('true');
    expect(params.get('deleted')).toBe('false');
  });

  it('should exclude undefined values', () => {
    const params = buildHttpParams({ name: 'test', missing: undefined });
    expect(params.get('name')).toBe('test');
    expect(params.has('missing')).toBeFalse();
  });

  it('should exclude null values', () => {
    const params = buildHttpParams({ name: 'test', empty: null });
    expect(params.get('name')).toBe('test');
    expect(params.has('empty')).toBeFalse();
  });

  it('should handle mixed types with null and undefined', () => {
    const params = buildHttpParams({
      sortBy: 'name',
      page: 1,
      categoryId: undefined,
      searchTerm: null,
      active: true,
    });
    expect(params.keys().length).toBe(3);
    expect(params.get('sortBy')).toBe('name');
    expect(params.get('page')).toBe('1');
    expect(params.get('active')).toBe('true');
  });
});
