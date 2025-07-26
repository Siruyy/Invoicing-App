import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

export interface AiQueryRequest {
  query: string;
  userId?: string;
}

export interface AiQueryResponse {
  query: string;
  response: string;
  timestamp: Date;
  error?: string;
  success: boolean;
}

export interface AiChatMessage {
  id: number;
  userId: string;
  isUserMessage: boolean;
  content: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AiQueryService {
  private baseUrl = `${environment.apiUrl}/AiQuery`;

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) { }

  /**
   * Send a query to the AI and get a response
   */
  processQuery(query: string): Observable<AiQueryResponse> {
    const request: AiQueryRequest = {
      query,
      // In a real app with auth, we'd get the user ID from the auth service
      userId: 'default-user'
    };
    
    return this.http.post<AiQueryResponse>(this.baseUrl, request);
  }

  /**
   * Get chat history for the current user
   */
  getChatHistory(limit: number = 50): Observable<AiChatMessage[]> {
    // In a real app with auth, we'd get the user ID from the auth service
    const userId = 'default-user';
    return this.http.get<AiChatMessage[]>(`${this.baseUrl}/history?userId=${userId}&limit=${limit}`);
  }

  /**
   * Clear chat history for the current user
   */
  clearChatHistory(): Observable<any> {
    // In a real app with auth, we'd get the user ID from the auth service
    const userId = 'default-user';
    return this.http.delete(`${this.baseUrl}/history?userId=${userId}`);
  }
}
