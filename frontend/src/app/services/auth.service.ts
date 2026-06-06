import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth/token/';
  private refreshUrl = 'http://localhost:8000/api/auth/token/refresh/';
  private registerUrl = 'http://localhost:8000/api/auth/register/';
  private membersUrl = 'http://localhost:8000/api/members/';
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const token = this.getToken();
    if (token) {
      const decoded = this.decodeToken(token);
      const role = decoded?.role || localStorage.getItem('role') || 'Member';
      this.currentUserSubject.next({ ...decoded, role });
    }
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  getRole(): string | null {
    const user = this.currentUserValue;
    return user ? user.role : localStorage.getItem('role');
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  isMember(): boolean {
    return this.getRole() === 'Member';
  }

  register(user: any): Observable<any> {
    return this.http.post<any>(this.registerUrl, user);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.membersUrl}me/`);
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.patch<any>(`${this.membersUrl}me/`, profileData);
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { username, password })
      .pipe(
        map(response => {
          if (response && response.access) {
            localStorage.setItem('access_token', response.access);
            localStorage.setItem('refresh_token', response.refresh);
            localStorage.setItem('username', username);
            const decoded = this.decodeToken(response.access);
            const role = decoded?.role || response.role || 'Member';
            localStorage.setItem('role', role);
            this.currentUserSubject.next({ ...decoded, role });
          }
          return response;
        })
      );
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }


  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.logout();
      return of(null);
    }
    return this.http.post<any>(this.refreshUrl, { refresh: refreshToken })
      .pipe(
        map(response => {
          if (response && response.access) {
            localStorage.setItem('access_token', response.access);
            this.currentUserSubject.next(this.decodeToken(response.access));
          }
          return response;
        }),
        catchError(err => {
          this.logout();
          throw err;
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Simple check if expired
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return false;
    
    const isExpired = Math.floor(new Date().getTime() / 1000) >= decoded.exp;
    if (isExpired) {
      // Try to use refresh token, handled by interceptor or guard
      return false;
    }
    return true;
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      return null;
    }
  }
}
