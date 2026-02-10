import { inject } from '@angular/core';
import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, switchMap, catchError, throwError } from 'rxjs';
import { GuestAuthService } from './guest-auth.service';

export function guestAuthInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  if (!req.url.includes('/api/carts/guest-cart')) {
    return next(req);
  }

  const guestAuthService = inject(GuestAuthService);

  return guestAuthService.ensureGuestToken().pipe(
    catchError((error) => {
      console.error('Guest auth token request failed:', error);
      return throwError(() => error);
    }),
    switchMap((token) => {
      const authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            return guestAuthService.getNewToken().pipe(
              switchMap((newToken) => {
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` },
                });
                return next(retryReq);
              }),
            );
          }
          return throwError(() => error);
        }),
      );
    }),
  );
}
