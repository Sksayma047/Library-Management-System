import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError(err => {
        // If we get an unauthorized 401 error, try to refresh the token
        if (err.status === 401 && !request.url.includes('/api/auth/')) {
          return this.handle401Error(request, next);
        }

        // Return error details properly
        let errorMsg = 'An error occurred';
        if (err.error) {
          if (typeof err.error === 'object') {
            errorMsg = err.error.detail || err.error.message || JSON.stringify(err.error);
          } else {
            errorMsg = err.error;
          }
        } else {
          errorMsg = err.message || err.statusText;
        }
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((tokenRes: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(tokenRes.access);
          return next.handle(this.addTokenHeader(request, tokenRes.access));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => err);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next.handle(this.addTokenHeader(request, token)))
    );
  }

  private addTokenHeader(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
