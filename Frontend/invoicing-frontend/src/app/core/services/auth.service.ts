import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  token: string;
  username: string;
  expiration: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<string | null>(this.getStoredUsername());
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient) {
    this.checkTokenExpiration();
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, loginRequest)
      .pipe(
        tap(response => {
          this.storeAuthData(response, loginRequest.rememberMe);
          this.currentUserSubject.next(response.username);
          this.setupTokenExpirationTimer(new Date(response.expiration));
        }),
        catchError(error => {
          console.error('Login failed', error);
          return throwError(() => new Error('Invalid username or password'));
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('expiration');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('expiration');
    
    this.currentUserSubject.next(null);
    
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const expiration = this.getExpiration();
    
    if (!token || !expiration) {
      return false;
    }
    
    return new Date() < expiration;
  }

  getToken(): string | null {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  private getStoredUsername(): string | null {
    return localStorage.getItem('username') || sessionStorage.getItem('username');
  }
  
  private getExpiration(): Date | null {
    const expirationStr = localStorage.getItem('expiration') || sessionStorage.getItem('expiration');
    return expirationStr ? new Date(expirationStr) : null;
  }

  private storeAuthData(response: LoginResponse, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('token', response.token);
    storage.setItem('username', response.username);
    storage.setItem('expiration', new Date(response.expiration).toISOString());
  }
  
  private setupTokenExpirationTimer(expiration: Date): void {
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    
    const expiresIn = expiration.getTime() - new Date().getTime();
    
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expiresIn);
  }
  
  private checkTokenExpiration(): void {
    if (this.isLoggedIn()) {
      const expiration = this.getExpiration();
      if (expiration) {
        this.setupTokenExpirationTimer(expiration);
      }
    } else {
      // If token is expired but still in storage, clean up
      if (this.getToken()) {
        this.logout();
      }
    }
  }
}
