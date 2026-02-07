import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', [], {
      isLoggedIn: jasmine.createSpy().and.returnValue(false),
      isAdmin: jasmine.createSpy().and.returnValue(false),
    });

    router = jasmine.createSpyObj('Router', ['parseUrl']);
    router.parseUrl.and.callFake((url: string) => ({ toString: () => url }) as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('should redirect to / when not logged in', () => {
    (authService.isLoggedIn as jasmine.Spy).and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(router.parseUrl).toHaveBeenCalledWith('/');
    expect(result).toBeTruthy();
    expect(typeof result).not.toBe('boolean');
  });

  it('should redirect to / when logged in but not admin', () => {
    (authService.isLoggedIn as jasmine.Spy).and.returnValue(true);
    (authService.isAdmin as jasmine.Spy).and.returnValue(false);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(router.parseUrl).toHaveBeenCalledWith('/');
  });

  it('should allow access when logged in and admin', () => {
    (authService.isLoggedIn as jasmine.Spy).and.returnValue(true);
    (authService.isAdmin as jasmine.Spy).and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));

    expect(result).toBe(true);
  });
});
