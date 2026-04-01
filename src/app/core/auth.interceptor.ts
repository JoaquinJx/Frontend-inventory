import { inject } from '@angular/core';
import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessionStoreService } from './session-store.service';

interface RefreshResponse {
  token: string;
  refreshToken?: string;
  username?: string;
  role?: string;
}

let refreshInFlight$: Observable<string> | null = null;

function isAuthPublicRoute(url: string): boolean {
  return /\/api\/auth\/(login|register|refresh)$/i.test(url);
}

function isPrivateRoute(url: string): boolean {
  return /\/api\/(products|orders|auth\/me|auth\/logout)/i.test(url);
}

function isOrderCreateRoute(method: string, url: string): boolean {
  return method.toUpperCase() === 'POST' && /\/api\/orders$/i.test(url);
}

function buildIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `idem-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionStoreService);
  const router = inject(Router);
  const httpBackend = inject(HttpBackend);
  const rawHttp = new HttpClient(httpBackend);
  const apiBaseUrl = environment.apiUrl.replace(/\/+$/, '').replace(/\/api$/, '');

  let request = req;

  if (isPrivateRoute(request.url) && session.token() && !request.headers.has('Authorization')) {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer ${session.token()}`,
      },
    });
  }

  if (isOrderCreateRoute(request.method, request.url) && !request.headers.has('Idempotency-Key')) {
    request = request.clone({
      setHeaders: {
        'Idempotency-Key': buildIdempotencyKey(),
      },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        isAuthPublicRoute(request.url) ||
        request.headers.has('x-auth-retried')
      ) {
        return throwError(() => error);
      }

      const refreshToken = session.refreshToken();
      if (!refreshToken) {
        session.clearSession();
        router.navigateByUrl('/admin');
        return throwError(() => error);
      }

      if (!refreshInFlight$) {
        refreshInFlight$ = rawHttp
          .post<RefreshResponse>(`${apiBaseUrl}/api/auth/refresh`, { refreshToken })
          .pipe(
            map((response) => {
              session.setSession({
                token: response.token,
                refreshToken: response.refreshToken ?? refreshToken,
                username: response.username ?? session.username(),
                role: response.role ?? session.role(),
              });

              return response.token;
            }),
            catchError((refreshError) => {
              session.clearSession();
              router.navigateByUrl('/admin');
              return throwError(() => refreshError);
            }),
            finalize(() => {
              refreshInFlight$ = null;
            }),
            shareReplay(1),
          );
      }

      return refreshInFlight$.pipe(
        switchMap((newToken) =>
          next(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
                'x-auth-retried': '1',
              },
            }),
          ),
        ),
      );
    }),
  );
};