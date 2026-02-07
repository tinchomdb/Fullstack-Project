import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, switchMap, catchError, throwError } from 'rxjs';
import { GuestAuthService } from './guest-auth.service';

@Injectable()
export class GuestAuthInterceptor implements HttpInterceptor {
  private readonly guestAuthService = inject(GuestAuthService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isGuestCartRequest(req)) {
      return next.handle(req);
    }

    return this.guestAuthService.ensureGuestToken().pipe(
      switchMap((token) => this.handleRequest(req, token, next)),
      catchError((error) => {
        console.error('Guest auth token request failed:', error);
        return throwError(() => error);
      }),
    );
  }

  private handleRequest(
    req: HttpRequest<unknown>,
    token: string,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const authReq = this.addAuthHeader(req, token);
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.guestAuthService.getNewToken().pipe(
            switchMap((newToken) => {
              const retryReq = this.addAuthHeader(req, newToken);
              return next.handle(retryReq);
            }),
          );
        }
        return throwError(() => error);
      }),
    );
  }

  private addAuthHeader(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private isGuestCartRequest(req: HttpRequest<unknown>): boolean {
    return req.url.includes('/api/carts/guest-cart');
  }
}
