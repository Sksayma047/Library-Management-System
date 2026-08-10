import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    // Check karein ki request humare backend API URL par ja rahi hai ya nahi
    const isApiUrl = request.url.startsWith(environment.apiUrl);
    
    // Auth endpoints par token append nahi karna hai
    const isAuthUrl = request.url.includes('/auth/token/');
    
    if (token && isApiUrl && !isAuthUrl) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request);
  }
}
