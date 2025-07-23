import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Client } from '../models/client.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  constructor(private api: ApiService) { }

  getClients(page: number = 1, limit: number = 10, search: string = ''): Observable<{ items: Client[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.api.get<{ items: Client[], total: number }>('/clients', params);
  }

  getClientById(id: number): Observable<Client> {
    return this.api.get<Client>(`/clients/${id}`);
  }

  createClient(client: Client): Observable<Client> {
    return this.api.post<Client>('/clients', client);
  }

  updateClient(id: number, client: Client): Observable<Client> {
    return this.api.put<Client>(`/clients/${id}`, client);
  }

  deleteClient(id: number): Observable<void> {
    return this.api.delete<void>(`/clients/${id}`);
  }
} 