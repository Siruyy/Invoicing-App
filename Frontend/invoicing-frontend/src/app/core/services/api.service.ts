import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${path}`, { params })
      .pipe(catchError(this.handleError));
  }

  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${path}`, body)
      .pipe(catchError(this.handleError));
  }

  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${path}`, body)
      .pipe(catchError(this.handleError));
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${path}`)
      .pipe(catchError(this.handleError));
  }

  patch<T>(path: string, body: any = {}): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}${path}`, body)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    // Log detailed error information to console for debugging
    console.error('API error', error);
    
    // Extract validation errors if available
    const validationErrors = error.error?.errors ? Object.values(error.error.errors).flat() : [];
    const errorMessage = validationErrors.length > 0 
      ? validationErrors.join(', ') 
      : error.error?.message || error.error?.title || 'Server error';
    
    return throwError(() => {
      const error$ = {
        status: error.status || 500,
        message: errorMessage,
        validationErrors: error.error?.errors || {}
      };
      return error$;
    });
  }
} 