import { PaginatedResource } from './paginated-resource';
import { of, throwError, Subject } from 'rxjs';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

describe('PaginatedResource', () => {
  let resource: PaginatedResource<string>;

  beforeEach(() => {
    resource = new PaginatedResource<string>();
  });

  it('should start with empty state', () => {
    expect(resource.items()).toEqual([]);
    expect(resource.totalCount()).toBe(0);
    expect(resource.totalPages()).toBe(0);
    expect(resource.currentPage()).toBe(1);
    expect(resource.loading()).toBe(false);
    expect(resource.error()).toBeNull();
    expect(resource.hasData()).toBe(false);
  });

  it('should load paginated data', () => {
    const response: PaginatedResponse<string> = {
      items: ['a', 'b', 'c'],
      totalCount: 10,
      page: 1,
      pageSize: 3,
      totalPages: 4,
    };

    resource.load(of(response));

    expect(resource.items()).toEqual(['a', 'b', 'c']);
    expect(resource.totalCount()).toBe(10);
    expect(resource.totalPages()).toBe(4);
    expect(resource.currentPage()).toBe(1);
    expect(resource.loading()).toBe(false);
    expect(resource.hasData()).toBe(true);
  });

  it('should handle errors', () => {
    resource.load(throwError(() => new Error('Network error')));
    expect(resource.error()).toBe('Network error');
    expect(resource.loading()).toBe(false);
  });

  it('should prevent duplicate loads', () => {
    const subject = new Subject<PaginatedResponse<string>>();
    resource.load(subject.asObservable());
    expect(resource.loading()).toBe(true);

    // Second call should be ignored
    resource.load(of({ items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 }));
    expect(resource.loading()).toBe(true);
  });

  it('should reset to initial state', () => {
    resource.load(of({ items: ['x'], totalCount: 1, page: 1, pageSize: 10, totalPages: 1 }));
    resource.reset();
    expect(resource.items()).toEqual([]);
    expect(resource.totalCount()).toBe(0);
    expect(resource.loading()).toBe(false);
    expect(resource.error()).toBeNull();
  });
});
