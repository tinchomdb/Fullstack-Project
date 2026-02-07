import { Resource } from './resource';
import { of, throwError, Subject } from 'rxjs';

describe('Resource', () => {
  let resource: Resource<string[]>;

  beforeEach(() => {
    resource = new Resource<string[]>([]);
  });

  it('should start with initial value', () => {
    expect(resource.data()).toEqual([]);
    expect(resource.loading()).toBe(false);
    expect(resource.error()).toBeNull();
    expect(resource.hasData()).toBe(false);
  });

  it('should set loading to true during load', () => {
    const subject = new Subject<string[]>();
    resource.load(subject.asObservable());
    expect(resource.loading()).toBe(true);
    expect(resource.error()).toBeNull();

    subject.next(['a', 'b']);
    subject.complete();

    expect(resource.loading()).toBe(false);
    expect(resource.data()).toEqual(['a', 'b']);
    expect(resource.hasData()).toBe(true);
  });

  it('should handle errors', () => {
    resource.load(throwError(() => new Error('fail')));
    expect(resource.loading()).toBe(false);
    expect(resource.error()).toBe('fail');
    expect(resource.data()).toEqual([]);
  });

  it('should handle errors without message', () => {
    resource.load(throwError(() => ({})));
    expect(resource.error()).toBe('An unexpected error occurred.');
  });

  it('should prevent duplicate loads', () => {
    const subject = new Subject<string[]>();
    resource.load(subject.asObservable());
    expect(resource.loading()).toBe(true);

    const subject2 = new Subject<string[]>();
    resource.load(subject2.asObservable());
    // Second load should be ignored while first is in progress
    expect(resource.loading()).toBe(true);
  });

  it('should clear data by default when loading', () => {
    resource.load(of(['initial']));
    expect(resource.data()).toEqual(['initial']);

    const subject = new Subject<string[]>();
    resource.load(subject.asObservable());
    expect(resource.data()).toEqual([]);
  });

  it('should preserve data when clearData is false', () => {
    resource.load(of(['initial']));
    expect(resource.data()).toEqual(['initial']);

    const subject = new Subject<string[]>();
    resource.load(subject.asObservable(), false);
    expect(resource.data()).toEqual(['initial']);
  });

  it('should reset to initial state', () => {
    resource.load(of(['data']));
    resource.reset();
    expect(resource.data()).toEqual([]);
    expect(resource.loading()).toBe(false);
    expect(resource.error()).toBeNull();
  });

  it('should set loading manually', () => {
    resource.setLoading(true);
    expect(resource.loading()).toBe(true);
    resource.setLoading(false);
    expect(resource.loading()).toBe(false);
  });

  it('should detect non-array hasData for non-null values', () => {
    const scalarResource = new Resource<string | null>(null);
    expect(scalarResource.hasData()).toBe(false);

    scalarResource.load(of('hello'));
    expect(scalarResource.hasData()).toBe(true);
  });

  it('should work with LoadingOverlayService', () => {
    const mockOverlay = { show: jasmine.createSpy('show'), hide: jasmine.createSpy('hide') };
    const res = new Resource<string[]>([], 'Loading...', mockOverlay as any);

    res.load(of(['data']));

    expect(mockOverlay.show).toHaveBeenCalledWith('Loading...');
    expect(mockOverlay.hide).toHaveBeenCalled();
  });
});
