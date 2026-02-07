import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
  HttpClient,
} from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { GuestAuthInterceptor } from './guest-auth.interceptor';
import { GuestAuthService } from './guest-auth.service';

describe('GuestAuthInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let guestAuthSpy: jasmine.SpyObj<GuestAuthService>;

  beforeEach(() => {
    guestAuthSpy = jasmine.createSpyObj('GuestAuthService', ['ensureGuestToken', 'getNewToken']);
    guestAuthSpy.ensureGuestToken.and.returnValue(of('guest-token-123'));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: GuestAuthService, useValue: guestAuthSpy },
        { provide: HTTP_INTERCEPTORS, useClass: GuestAuthInterceptor, multi: true },
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

  it('should propagate non-401 errors', () => {
    httpClient.get('/api/carts/guest-cart').subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpMock.expectOne('/api/carts/guest-cart');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
  });
});
