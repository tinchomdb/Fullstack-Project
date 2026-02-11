import { InfiniteScrollResource } from './infinite-scroll-resource';
import { of, throwError, Subject } from 'rxjs';
import { PaginatedResponse } from '../../core/models/paginated-response.model';

describe('InfiniteScrollResource', () => {
  let resource: InfiniteScrollResource<string>;

  beforeEach(() => {
    resource = new InfiniteScrollResource<string>();
  });

  it('should start with empty state', () => {
    expect(resource.items()).toEqual([]);
    expect(resource.totalCount()).toBe(0);
    expect(resource.totalPages()).toBe(0);
    expect(resource.currentPage()).toBe(0);
    expect(resource.loading()).toBe(false);
    expect(resource.loadingMore()).toBe(false);
    expect(resource.error()).toBeNull();
    expect(resource.hasData()).toBe(false);
    expect(resource.hasMore()).toBe(false);
  });

  it('should load initial data', () => {
    const response: PaginatedResponse<string> = {
      items: ['a', 'b'],
      totalCount: 6,
      page: 1,
      pageSize: 2,
      totalPages: 3,
    };

    resource.load(of(response));

    expect(resource.items()).toEqual(['a', 'b']);
    expect(resource.totalCount()).toBe(6);
    expect(resource.currentPage()).toBe(1);
    expect(resource.totalPages()).toBe(3);
    expect(resource.loading()).toBe(false);
    expect(resource.hasData()).toBe(true);
    expect(resource.hasMore()).toBe(true);
  });

  it('should append items on loadMore', () => {
    resource.load(of({ items: ['a', 'b'], totalCount: 4, page: 1, pageSize: 2, totalPages: 2 }));

    resource.loadMore(
      of({ items: ['c', 'd'], totalCount: 4, page: 2, pageSize: 2, totalPages: 2 }),
    );

    expect(resource.items()).toEqual(['a', 'b', 'c', 'd']);
    expect(resource.currentPage()).toBe(2);
    expect(resource.hasMore()).toBe(false);
    expect(resource.loadingMore()).toBe(false);
  });

  it('should not loadMore when hasMore is false', () => {
    resource.load(of({ items: ['a'], totalCount: 1, page: 1, pageSize: 10, totalPages: 1 }));

    const subject = new Subject<PaginatedResponse<string>>();
    resource.loadMore(subject.asObservable());

    // loadMore should not start because hasMore is false
    expect(resource.loadingMore()).toBe(false);
  });

  it('should not loadMore while already loading more', () => {
    resource.load(of({ items: ['a'], totalCount: 4, page: 1, pageSize: 1, totalPages: 4 }));

    const subject1 = new Subject<PaginatedResponse<string>>();
    resource.loadMore(subject1.asObservable());
    expect(resource.loadingMore()).toBe(true);

    // Second loadMore should be ignored
    const subject2 = new Subject<PaginatedResponse<string>>();
    resource.loadMore(subject2.asObservable());
    expect(resource.loadingMore()).toBe(true);
  });

  it('should handle load errors', () => {
    resource.load(throwError(() => new Error('Load failed')));
    expect(resource.error()).toBe('Load failed');
    expect(resource.loading()).toBe(false);
  });

  it('should handle loadMore errors', () => {
    resource.load(of({ items: ['a'], totalCount: 4, page: 1, pageSize: 1, totalPages: 4 }));

    resource.loadMore(throwError(() => new Error('More failed')));
    expect(resource.error()).toBe('More failed');
    expect(resource.loadingMore()).toBe(false);
  });

  it('should keep previous items visible while loading new data', () => {
    resource.load(of({ items: ['old'], totalCount: 1, page: 1, pageSize: 10, totalPages: 1 }));
    expect(resource.items()).toEqual(['old']);

    const subject = new Subject<PaginatedResponse<string>>();
    resource.load(subject.asObservable());
    expect(resource.items()).toEqual(['old']);
    expect(resource.loading()).toBe(true);

    subject.next({ items: ['new'], totalCount: 1, page: 1, pageSize: 10, totalPages: 1 });
    expect(resource.items()).toEqual(['new']);
    expect(resource.loading()).toBe(false);
  });

  it('should reset to initial state', () => {
    resource.load(of({ items: ['a'], totalCount: 1, page: 1, pageSize: 10, totalPages: 1 }));
    resource.reset();

    expect(resource.items()).toEqual([]);
    expect(resource.totalCount()).toBe(0);
    expect(resource.totalPages()).toBe(0);
    expect(resource.currentPage()).toBe(0);
    expect(resource.loading()).toBe(false);
    expect(resource.loadingMore()).toBe(false);
    expect(resource.error()).toBeNull();
  });

  it('should prevent duplicate load calls', () => {
    const subject = new Subject<PaginatedResponse<string>>();
    resource.load(subject.asObservable());
    expect(resource.loading()).toBe(true);

    // Second load should be ignored
    resource.load(of({ items: ['x'], totalCount: 1, page: 1, pageSize: 10, totalPages: 1 }));
    expect(resource.loading()).toBe(true);
    expect(resource.items()).toEqual([]);  // Still empty since first load hasn't resolved
  });
});
