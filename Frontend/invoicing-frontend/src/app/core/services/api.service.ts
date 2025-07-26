import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
  
  getBlob(path: string, params: HttpParams = new HttpParams()): Observable<Blob> {
    const url = `${this.apiUrl}${path}`;
    
    // Set up request options with responseType: 'blob'
    const options = { 
      params, 
      responseType: 'blob' as 'blob',  // Type assertion needed for correct typing
      observe: 'body' as 'body'        // Explicitly observe the response body only
    };
    
    // Make the request
    return this.http.get(url, options).pipe(
      catchError(error => {
        return throwError(() => new Error('Failed to download file. Please try again.'));
      })
    );
  }
  
  // Helper method to read a blob as JSON (for error handling)
  private readBlobAsJson(blob: Blob): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const jsonData = JSON.parse(reader.result as string);
          resolve(jsonData);
        } catch (e) {
          reject(new Error('Invalid JSON in response'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read response'));
      reader.readAsText(blob);
    });
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