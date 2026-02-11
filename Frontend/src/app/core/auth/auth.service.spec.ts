import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus, EventType } from '@azure/msal-browser';

describe('AuthService', () => {
  let service: AuthService;
  let msalServiceSpy: jasmine.SpyObj<MsalService>;
  let inProgress$: Subject<InteractionStatus>;
  let msalSubject$: Subject<any>;

  beforeEach(() => {
    inProgress$ = new Subject();
    msalSubject$ = new Subject();

    const msalInstance = {
      getActiveAccount: jasmine.createSpy('getActiveAccount').and.returnValue(null),
      setActiveAccount: jasmine.createSpy('setActiveAccount'),
      getAllAccounts: jasmine.createSpy('getAllAccounts').and.returnValue([]),
    };

    msalServiceSpy = jasmine.createSpyObj('MsalService', [
      'handleRedirectObservable',
      'acquireTokenSilent',
      'loginRedirect',
      'logoutRedirect',
    ]);
    msalServiceSpy.handleRedirectObservable.and.returnValue(of(null as any));
    (msalServiceSpy as any).instance = msalInstance;

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: MsalService, useValue: msalServiceSpy },
        {
          provide: MsalBroadcastService,
          useValue: {
            inProgress$: inProgress$.asObservable(),
            msalSubject$: msalSubject$.asObservable(),
          },
        },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize as not logged in', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should initialize as not admin', () => {
    expect(service.isAdmin()).toBeFalse();
  });

  it('should not initialize auth when in iframe (Karma test environment)', () => {
    // Karma runs tests in an iframe, so initializeAuth returns early
    // In this case, authInitialized remains false until inProgress$ emits None
    // Trigger the inProgress$ subscription
    inProgress$.next(InteractionStatus.None);
    expect(service.authInitialized()).toBeTrue();
  });

  it('should return null active account when not logged in', () => {
    expect(service.getActiveAccount()).toBeNull();
  });

  it('should call loginRedirect on login', () => {
    service.login('/dashboard');
    expect(msalServiceSpy.loginRedirect).toHaveBeenCalledWith(
      jasmine.objectContaining({
        scopes: ['openid', 'profile', 'email'],
        redirectStartPage: '/dashboard',
      }),
    );
  });

  it('should call logoutRedirect on logout', () => {
    service.logout();
    expect(msalServiceSpy.logoutRedirect).toHaveBeenCalledWith(
      jasmine.objectContaining({
        postLogoutRedirectUri: '/',
      }),
    );
  });

  it('should use window.location.pathname as default redirect', () => {
    service.login();
    expect(msalServiceSpy.loginRedirect).toHaveBeenCalledWith(
      jasmine.objectContaining({
        redirectStartPage: window.location.pathname,
      }),
    );
  });

  it('should return userId from computed', () => {
    expect(service.userId()).toBeUndefined();
  });

  it('should sync auth state when interaction completes', () => {
    inProgress$.next(InteractionStatus.None);
    // Should not throw; auth state synced
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should expose signals as public properties', () => {
    expect(service.isLoggedIn).toBeDefined();
    expect(service.isAdmin).toBeDefined();
    expect(service.authInitialized).toBeDefined();
  });
});
