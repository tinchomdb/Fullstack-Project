import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { guestAuthInterceptor } from './guest-auth.interceptor';
import { GuestAuthService } from './guest-auth.service';

describe('guestAuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let guestAuthSpy: jasmine.SpyObj<GuestAuthService>;

  beforeEach(() => {
    guestAuthSpy = jasmine.createSpyObj('GuestAuthService', ['ensureGuestToken', 'getNewToken']);
    guestAuthSpy.ensureGuestToken.and.returnValue(of('guest-token-123'));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([guestAuthInterceptor])),
        provideHttpClientTesting(),
        { provide: GuestAuthService, useValue: guestAuthSpy },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add auth header to guest cart requests', () => {
    httpClient.get('/api/carts/guest-cart').subscribe();

    const req = httpMock.expectOne('/api/carts/guest-cart');
    expect(req.request.headers.get('Authorization')).toBe('Bearer guest-token-123');
    req.flush({});
  });

  it('should not add auth header to non-guest-cart requests', () => {
    httpClient.get('/api/products').subscribe();

    const req = httpMock.expectOne('/api/products');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should retry with new token on 401', () => {
    guestAuthSpy.getNewToken.and.returnValue(of('new-guest-token'));

    httpClient.get('/api/carts/guest-cart').subscribe();

    const req = httpMock.expectOne('/api/carts/guest-cart');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    const retryReq = httpMock.expectOne('/api/carts/guest-cart');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-guest-token');
    retryReq.flush({});
  });

  it('should propagate non-401 errors without logging auth error', () => {
    const consoleSpy = spyOn(console, 'error');
    httpClient.get('/api/carts/guest-cart').subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('/api/carts/guest-cart');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should propagate 409 conflict errors without logging auth error', () => {
    const consoleSpy = spyOn(console, 'error');
    httpClient.post('/api/carts/guest-cart/items', {}).subscribe({
      error: (err) => {
        expect(err.status).toBe(409);
      },
    });

    const req = httpMock.expectOne('/api/carts/guest-cart/items');
    req.flush(
      { error: 'Insufficient stock', requestedQuantity: 29, availableStock: 28 },
      { status: 409, statusText: 'Conflict' },
    );
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
