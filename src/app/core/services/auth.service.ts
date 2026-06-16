import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  RegisterCandidateRequest,
  RegisterEnterpriseRequest,
  AuthResponse,
  UserProfile,
  RefreshTokenRequest,
  UserRole
} from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_PROFILE_KEY = 'user_profile';

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(this.getUserProfileFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  isAuthenticated = signal<boolean>(this.hasValidToken());

  constructor() {
    // Check token validity on service initialization
    if (this.hasValidToken()) {
      this.isAuthenticated.set(true);
    }
  }

  // Registration methods
  registerCandidate(request: RegisterCandidateRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/candidate`, request).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(this.handleError)
    );
  }

  registerEnterprise(request: RegisterEnterpriseRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/enterprise`, request).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(this.handleError)
    );
  }

  // Login
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(this.handleError)
    );
  }

  // Refresh token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, request).pipe(
      tap(response => this.handleAuthResponse(response)),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  // Logout
  logout(): void {
    const refreshToken = this.getRefreshToken();
    
    if (refreshToken) {
      const request: RefreshTokenRequest = { refreshToken };
      this.http.post(`${this.apiUrl}/logout`, request).subscribe({
        complete: () => this.clearAuthData()
      });
    } else {
      this.clearAuthData();
    }
  }

  // Get current user
  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap(profile => {
        this.saveUserProfile(profile);
        this.currentUserSubject.next(profile);
      }),
      catchError(this.handleError)
    );
  }

  // Token management
  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  hasValidToken(): boolean {
    return !!this.getAccessToken();
  }

  getUserProfile(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: UserRole): boolean {
    const profile = this.getUserProfile();
    return profile?.roles?.includes(role) ?? false;
  }

  isCandidate(): boolean {
    return this.hasRole(UserRole.CANDIDATE);
  }

  isEnterprise(): boolean {
    return this.hasRole(UserRole.ENTREPRISE);
  }

  // Private helper methods
  private handleAuthResponse(response: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, response.accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    this.saveUserProfile(response.userProfile);
    this.currentUserSubject.next(response.userProfile);
    this.isAuthenticated.set(true);
  }

  private saveUserProfile(profile: UserProfile): void {
    if (this.isBrowser) {
      localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
    }
  }

  private getUserProfileFromStorage(): UserProfile | null {
    if (!this.isBrowser) return null;
    const profileJson = localStorage.getItem(this.USER_PROFILE_KEY);
    if (profileJson) {
      try {
        return JSON.parse(profileJson);
      } catch {
        return null;
      }
    }
    return null;
  }

  private clearAuthData(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_PROFILE_KEY);
      localStorage.removeItem('isAuthenticated');
    }
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth error:', error);
    return throwError(() => error);
  }
}
