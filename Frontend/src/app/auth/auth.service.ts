import { Injectable, signal, inject, computed } from '@angular/core';
import {
  MsalService,
  MsalBroadcastService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
} from '@azure/msal-angular';
import {
  AuthenticationResult,
  InteractionStatus,
  RedirectRequest,
  EventMessage,
  EventType,
} from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly msalGuardConfig = inject(MSAL_GUARD_CONFIG) as unknown as MsalGuardConfiguration;

  private readonly _destroying$ = new Subject<void>();
  private readonly GUEST_SESSION_KEY = 'guestSessionId';

  readonly isLoggedIn = signal(false);

  readonly userId = computed(() => {
    this.isLoggedIn();
    const account = this.getActiveAccount();
    return account?.localAccountId ?? this.getOrCreateGuestSession();
  });

  constructor() {
    this.authService.instance.enableAccountStorageEvents();

    // Handle redirect promise to process the authentication response
    // This runs after MSAL initialization (handled in app.config.ts)
    this.authService.instance
      .handleRedirectPromise()
      .then((response) => {
        if (response) {
          this.authService.instance.setActiveAccount(response.account);
        }
        this.updateLoginStatus();
      })
      .catch((error) => {
        console.error('Error handling redirect:', error);
        this.updateLoginStatus();
      });

    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$),
      )
      .subscribe(() => {
        this.updateLoginStatus();
        this.checkAndSetActiveAccount();
      });

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGOUT_SUCCESS),
        takeUntil(this._destroying$),
      )
      .subscribe(() => {
        this.updateLoginStatus();
        this.checkAndSetActiveAccount();
      });

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this._destroying$),
      )
      .subscribe((result: EventMessage) => {
        const payload = result.payload as AuthenticationResult;
        this.authService.instance.setActiveAccount(payload.account);
        this.updateLoginStatus();
      });
  }

  private updateLoginStatus() {
    this.isLoggedIn.set(this.authService.instance.getAllAccounts().length > 0);
  }

  getActiveAccount() {
    return this.authService.instance.getActiveAccount();
  }

  private checkAndSetActiveAccount() {
    let activeAccount = this.authService.instance.getActiveAccount();

    if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
      let accounts = this.authService.instance.getAllAccounts();
      this.authService.instance.setActiveAccount(accounts[0]);
    }
  }

  login(redirectUrl?: string) {
    const redirectStartPage = redirectUrl || window.location.pathname;

    if (this.msalGuardConfig.authRequest) {
      this.authService.loginRedirect({
        ...this.msalGuardConfig.authRequest,
        redirectStartPage,
      } as RedirectRequest);
    } else {
      this.authService.loginRedirect({
        scopes: ['openid', 'profile', 'email'],
        redirectStartPage,
      } as RedirectRequest);
    }
  }

  logout() {
    this.authService.logoutRedirect({
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
