import { Injectable, signal, inject, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import {
  AuthenticationResult,
  InteractionStatus,
  EventMessage,
  EventType,
  AccountInfo,
} from '@azure/msal-browser';
import { filter } from 'rxjs/operators';
import { apiScope } from './auth-config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _isLoggedIn = signal(false);
  private readonly _isAdmin = signal(false);
  private readonly _authInitialized = signal(false);

  readonly isLoggedIn = this._isLoggedIn.asReadonly();
  readonly isAdmin = this._isAdmin.asReadonly();
  readonly authInitialized = this._authInitialized.asReadonly();

  readonly userId = computed(() => {
    this._isLoggedIn();
    const account = this.getActiveAccount();
    return account?.localAccountId;
  });

  constructor() {
    this.initializeAuth();
    this.subscribeToAuthEvents();
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

  getActiveAccount(): AccountInfo | null {
    return this.msalService.instance.getActiveAccount();
  }

  private initializeAuth(): void {
    const isIframe = window !== window.parent && !window.opener;
    if (isIframe) {
      return;
    }

    this.msalService.handleRedirectObservable().subscribe({
      next: (response: AuthenticationResult | null) => {
        if (response?.account) {
          this.msalService.instance.setActiveAccount(response.account);
        }
        this.syncAuthState();
      },
      error: (error: Error) => {
        console.error('Error handling redirect:', error);
        this.syncAuthState();
      },
    });
  }

  private subscribeToAuthEvents(): void {
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntilDestroyed(this.destroyRef),
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event: EventMessage) => {
        if (event.eventType === EventType.LOGIN_SUCCESS) {
          const payload = event.payload as AuthenticationResult;
          this.msalService.instance.setActiveAccount(payload.account);
        }
        this.syncAuthState();
      });
  }

  private syncAuthState(): void {
    this.ensureActiveAccount();
    const account = this.msalService.instance.getActiveAccount();

    if (account) {
      this.refreshTokenClaims(account);
    } else {
      this._isLoggedIn.set(false);
      this._isAdmin.set(false);
      this._authInitialized.set(true);
    }
  }

  private ensureActiveAccount(): void {
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0 && !this.msalService.instance.getActiveAccount()) {
      this.msalService.instance.setActiveAccount(accounts[0]);
    }
  }

  private refreshTokenClaims(account: AccountInfo): void {
    // First, update admin status with existing claims to avoid showing stale state
    this.updateAdminStatus(account);

    // Then try to refresh the token silently with API scope to get roles claim
    // The API scope is required because roles are included in the access token, not just the ID token
    this.msalService
      .acquireTokenSilent({
        scopes: [apiScope],
        account,
      })
      .subscribe({
        next: (result: AuthenticationResult) => {
          if (result.account) {
            this.msalService.instance.setActiveAccount(result.account);
            this.updateAdminStatus(result.account);
            this._isLoggedIn.set(true);
          }
          this._authInitialized.set(true);
        },
        error: (error: unknown) => {
          if (error instanceof Error && error.name === 'InteractionRequiredAuthError') {
            // Token expired and needs user interaction to refresh
            // Downgrade to guest state to avoid immediate redirect loop
            console.info('Session expired. Downgrading to guest state.');
            this.msalService.instance.setActiveAccount(null);
            this._isLoggedIn.set(false);
            this._isAdmin.set(false);
          } else {
            console.error('Error refreshing token claims:', error);
            this._isLoggedIn.set(false);
          }
          this._authInitialized.set(true);
        },
      });
  }

  private updateAdminStatus(account: AccountInfo): void {
    const claims = account.idTokenClaims as Record<string, unknown> | undefined;
    const roles = (claims?.['roles'] as string[]) || [];
    this._isAdmin.set(roles.includes('admin'));
  }
}
