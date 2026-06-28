import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    // Skip guard on server — client will re-check after hydration
    if (!isPlatformBrowser(platformId)) {
      return true;
    }

    if (!authService.isAuthenticated() && !authService.hasValidToken()) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const userProfile = authService.getUserProfile();
    if (!userProfile) {
      router.navigate(['/login']);
      return false;
    }

    const hasRole = allowedRoles.some(role => authService.hasRole(role));
    if (hasRole) {
      return true;
    }

    // Redirect to appropriate dashboard based on role
    if (authService.isEnterprise()) {
      router.navigate(['/dashboard']);
    } else if (authService.isCandidate()) {
      router.navigate(['/jobs']);
    } else {
      router.navigate(['/']);
    }
    
    return false;
  };
};
