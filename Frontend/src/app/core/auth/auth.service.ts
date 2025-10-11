import { Injectable, signal, inject, computed } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {
  AuthenticationResult,
  InteractionStatus,
  EventMessage,
  EventType,
  AccountInfo,
} from '@azure/msal-browser';
import { Subject, Observable } from 'rxjs';
import { filter, takeUntil, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly destroy$ = new Subject<void>();
  private readonly loginCompleted$ = new Subject<AccountInfo>();

  private readonly GUEST_SESSION_KEY = 'guestSessionId';

  readonly isLoggedIn = signal(false);
  readonly isAdmin = signal(false);

  // Expose as observable for services to subscribe to login events
  readonly onLoginCompleted$: Observable<AccountInfo> = this.loginCompleted$.asObservable();

  readonly userId = computed(() => {
    this.isLoggedIn();
    const account = this.getActiveAccount();
    return account?.localAccountId ?? this.getOrCreateGuestSession();
  });

  constructor() {
    this.initializeAuth();
    this.subscribeToAuthEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeAuth(): void {
    this.msalService.instance
      .handleRedirectPromise()
      .then((response: AuthenticationResult | null) => {
        if (response?.account) {
          this.msalService.instance.setActiveAccount(response.account);
        }
        this.syncAuthState();
      })
      .catch((error: Error) => {
        console.error('Error handling redirect:', error);
        this.syncAuthState();
      });
  }

  private subscribeToAuthEvents(): void {
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.syncAuthState());

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => {
          const relevantEvents: EventType[] = [
            EventType.LOGIN_SUCCESS,
            EventType.LOGOUT_SUCCESS,
            EventType.ACCOUNT_ADDED,
            EventType.ACCOUNT_REMOVED,
          ];
          return relevantEvents.includes(msg.eventType);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((event: EventMessage) => {
        if (event.eventType === EventType.LOGIN_SUCCESS) {
          const payload = event.payload as AuthenticationResult;
          this.msalService.instance.setActiveAccount(payload.account);

          // Emit login completed event for other services
          if (payload.account) {
            this.loginCompleted$.next(payload.account);
          }
        }
        this.syncAuthState();
      });
  }

  private syncAuthState(): void {
    this.ensureActiveAccount();
    const account = this.msalService.instance.getActiveAccount();

    if (account) {
      this.isLoggedIn.set(true);
      this.refreshTokenClaims(account);
    } else {
      this.isLoggedIn.set(false);
      this.isAdmin.set(false);
    }
  }

  private ensureActiveAccount(): void {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0 && !this.msalService.instance.getActiveAccount()) {
      this.msalService.instance.setActiveAccount(accounts[0]);
    }
  }

  private refreshTokenClaims(account: AccountInfo): void {
    this.msalService
      .acquireTokenSilent({
        scopes: ['openid', 'profile', 'email'],
        account,
      })
      .subscribe({
        next: (result: AuthenticationResult) => {
          if (result.account) {
            this.msalService.instance.setActiveAccount(result.account);
            this.updateAdminStatus(result.account);
          }
        },
        error: (error: Error) => {
          console.error('Error refreshing token claims:', error);
          this.updateAdminStatus(account);
        },
      });
  }

  private updateAdminStatus(account: AccountInfo): void {
    const claims = account.idTokenClaims as Record<string, any> | undefined;
    const roles = (claims?.['roles'] as string[]) || [];
    this.isAdmin.set(roles.includes('admin'));
  }

  getActiveAccount(): AccountInfo | null {
    return this.msalService.instance.getActiveAccount();
  }

  login(redirectUrl?: string): void {
    this.msalService.loginRedirect({
      scopes: ['openid', 'profile', 'email'],
      redirectStartPage: redirectUrl || window.location.pathname,
    });
  }

  logout(): void {
    this.msalService.logoutRedirect({
      account: this.getActiveAccount(),
      postLogoutRedirectUri: '/',
    });
  }

  getUserId(): string {
    return this.userId();
  }

  getGuestSessionId(): string | null {
    return localStorage.getItem(this.GUEST_SESSION_KEY);
  }

  clearGuestSession(): void {
    localStorage.removeItem(this.GUEST_SESSION_KEY);
  }

  private getOrCreateGuestSession(): string {
    let guestId = localStorage.getItem(this.GUEST_SESSION_KEY);

    if (!guestId) {
      guestId = `guest-${crypto.randomUUID()}`;
      localStorage.setItem(this.GUEST_SESSION_KEY, guestId);
    }

    return guestId;
  }
}
