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

  readonly loginDisplay = signal(false);

  readonly userId = computed(() => {
    this.loginDisplay();
    const account = this.getActiveAccount();
    return account?.localAccountId ?? this.getOrCreateGuestSession();
  });

  constructor() {
    this.authService.instance.enableAccountStorageEvents();

    this.authService.instance.handleRedirectPromise().then((response) => {
      if (response) {
        this.authService.instance.setActiveAccount(response.account);
      }
      this.setLoginDisplay();
    });

    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$),
      )
      .subscribe(() => {
        this.setLoginDisplay();
        this.checkAndSetActiveAccount();
      });

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGOUT_SUCCESS),
        takeUntil(this._destroying$),
      )
      .subscribe(() => {
        this.setLoginDisplay();
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
        this.setLoginDisplay();
      });
  }

  private setLoginDisplay() {
    this.loginDisplay.set(this.authService.instance.getAllAccounts().length > 0);
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

  login() {
    if (this.msalGuardConfig.authRequest) {
      this.authService.loginRedirect({
        ...this.msalGuardConfig.authRequest,
      } as RedirectRequest);
    } else {
      this.authService.loginRedirect();
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
