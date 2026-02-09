import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { GuestAuthService } from './guest-auth.service';
import { environment } from '../../../environments/environment';

describe('GuestAuthService', () => {
  let service: GuestAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem('guest_token');

    TestBed.configureTestingModule({
      providers: [GuestAuthService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(GuestAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('guest_token');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have no token initially', () => {
    expect(service.hasToken()).toBeFalse();
  });

  it('should request a guest token from API', () => {
    service.ensureGuestToken().subscribe((token) => {
      expect(token).toBe('test-jwt-token');
    });

    const req = httpMock.expectOne(`${environment.apiBase}/api/GuestAuth/guest-token`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'test-jwt-token', tokenType: 'Bearer' });
  });

  it('should store token in localStorage', () => {
    service.ensureGuestToken().subscribe();

    const req = httpMock.expectOne(`${environment.apiBase}/api/GuestAuth/guest-token`);
    req.flush({ token: 'test-jwt-token', tokenType: 'Bearer' });

    expect(localStorage.getItem('guest_token')).toBe('test-jwt-token');
  });

  it('should clear token', () => {
    localStorage.setItem('guest_token', 'old-token');
    service.clearToken();
    expect(localStorage.getItem('guest_token')).toBeNull();
  });

  it('should return null guest session id when no token', () => {
    expect(service.requestGuestSessionId()).toBeNull();
  });

  it('should get new token after clearing', () => {
    service.getNewToken().subscribe((token) => {
      expect(token).toBe('new-token');
    });

    const req = httpMock.expectOne(`${environment.apiBase}/api/GuestAuth/guest-token`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'new-token', tokenType: 'Bearer' });
  });

  it('should update hasToken to true after storing a token', () => {
    expect(service.hasToken()).toBeFalse();

    service.ensureGuestToken().subscribe();

    const req = httpMock.expectOne(`${environment.apiBase}/api/GuestAuth/guest-token`);
    req.flush({ token: 'test-jwt-token', tokenType: 'Bearer' });

    expect(service.hasToken()).toBeTrue();
  });

  it('should update hasToken to false after clearing token', () => {
    service.ensureGuestToken().subscribe();

    const req = httpMock.expectOne(`${environment.apiBase}/api/GuestAuth/guest-token`);
    req.flush({ token: 'test-jwt-token', tokenType: 'Bearer' });

    expect(service.hasToken()).toBeTrue();

    service.clearToken();

    expect(service.hasToken()).toBeFalse();
  });
});
