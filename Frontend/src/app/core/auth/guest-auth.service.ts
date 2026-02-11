import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

interface GuestTokenResponse {
  token: string;
  tokenType: string;
}

interface GuestTokenClaims {
  sub?: string;
  guestSessionId?: string;
  exp?: number;
  iat?: number;
}

const GUEST_TOKEN_KEY = 'guest_token';

@Injectable({
  providedIn: 'root',
})
export class GuestAuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/api/GuestAuth`;
  private cachedToken: string | null = this.getStoredToken();
  private pendingTokenRequest$: Observable<string> | null = null;
  readonly hasToken = signal(!!this.cachedToken && !this.isTokenExpired(this.cachedToken));

  ensureGuestToken(): Observable<string> {
    const storedToken = this.cachedToken;

    if (storedToken && !this.isTokenExpired(storedToken)) {
      return of(storedToken);
    }

    if (!this.pendingTokenRequest$) {
      this.pendingTokenRequest$ = this.http
        .post<GuestTokenResponse>(`${this.baseUrl}/guest-token`, {})
        .pipe(
          tap((response) => {
            this.storeToken(response.token);
            this.pendingTokenRequest$ = null;
          }),
          map((response) => response.token),
          catchError((error) => {
            console.error('Failed to fetch guest token:', error);
            this.pendingTokenRequest$ = null;
            throw error;
          }),
        );
    }

    return this.pendingTokenRequest$;
  }

  requestGuestSessionId(): string | null {
    const storedToken = this.cachedToken;
    if (storedToken && !this.isTokenExpired(storedToken)) {
      const claims = this.decodeToken(storedToken);
      return claims?.guestSessionId || null;
    }
    return null;
  }

  clearToken(): void {
    this.removeStoredToken();
    this.cachedToken = null;
    this.pendingTokenRequest$ = null;
    this.hasToken.set(false);
  }

  getNewToken(): Observable<string> {
    this.clearToken();
    return this.ensureGuestToken();
  }

  private storeToken(token: string): void {
    try {
      localStorage.setItem(GUEST_TOKEN_KEY, token);
      this.cachedToken = token;
    } catch (error) {
      console.error('Failed to store guest token:', error);
      this.cachedToken = token;
    }
    this.hasToken.set(true);
  }

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(GUEST_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve guest token:', error);
      return null;
    }
  }

  private removeStoredToken(): void {
    try {
      localStorage.removeItem(GUEST_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove guest token:', error);
    }
  }

  private decodeToken(token: string): GuestTokenClaims | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded) as GuestTokenClaims;
    } catch (error) {
      console.error('Failed to decode guest token:', error);
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const claims = this.decodeToken(token);
    if (!claims?.exp) {
      return false;
    }

    const expirationTime = claims.exp * 1000;
    const currentTime = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

    return currentTime >= expirationTime - bufferTime;
  }
}
