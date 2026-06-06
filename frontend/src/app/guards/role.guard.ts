import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const allowedRoles = route.data['roles'] as Array<string>;
    const userRole = this.authService.getRole();

    if (!allowedRoles || allowedRoles.includes(userRole || '')) {
      return true;
    }

    // Redirect to access-denied page
    this.router.navigate(['/access-denied']);
    return false;
  }
}
