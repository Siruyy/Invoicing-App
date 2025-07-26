import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Client } from '../models/client.model';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
    
    return this.api.get<Client[]>('/clients', params).pipe(
      map(clients => {
        // Backend returns an array, but frontend expects { items, total }
        const normalizedClients = clients.map(client => this.normalizeClientData(client));
        return {
          items: normalizedClients,
          total: normalizedClients.length
        };
      })
    );
  }

  getClientById(id: number): Observable<Client> {
    return this.api.get<Client>(`/clients/${id}`).pipe(
      map(client => this.normalizeClientData(client))
    );
  }

  createClient(client: any): Observable<Client> {
    // Wrap the client data in a clientDto object for the backend
    return this.api.post<Client>('/clients', client);
  }

  updateClient(id: number, client: any): Observable<Client> {
    return this.api.put<Client>(`/clients/${id}`, client);
  }

  deleteClient(id: number): Observable<void> {
    return this.api.delete<void>(`/clients/${id}`);
  }
  
  /**
   * Import clients from CSV file
   * @param file The CSV file to import
   * @returns Observable with import result
   */
  importClientsFromCsv(file: File): Observable<{ imported: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.api.post<{ imported: number }>('/clients/import', formData);
  }
  
  /**
   * Export clients to CSV
   * @param ids Array of client IDs to export (empty for all clients)
   * @returns Observable with CSV blob
   */
  exportClientsToCsv(ids: number[] = []): Observable<Blob> {
    console.log('Starting client export process');
    let params = new HttpParams();
    
    if (ids.length > 0) {
      params = params.set('ids', ids.join(','));
    }
    
    console.log('Making export request to API');
    // Use our ApiService's getBlob method
    return this.api.getBlob('/clients/export', params).pipe(
      catchError(error => {
        console.error('CSV export error:', error);
        return throwError(() => new Error('Failed to export clients. Please check the console for details.'));
      })
    );
  }

  /**
   * Helper method to normalize client data for the frontend
   * Handles both backend format (flat fields) and frontend format (nested address)
   */
  private normalizeClientData(client: any): Client {
    // If address is already an object with nested properties, return as is
    if (client && client.address && typeof client.address === 'object') {
      return client;
    }

    // If the backend returns flat fields, structure them into the frontend model
    const addressObject = client ? {
      street: client.address || '',
      city: client.city || '',
      state: client.state || '',
      zipCode: client.zipCode || '',
      country: client.country || ''
    } : undefined;

    // Create a copy of the client with the structured address
    return {
      ...client,
      // Only add the address object if we have at least one address field
      ...(addressObject && (client.address || client.city || client.state || client.zipCode || client.country) 
          ? { address: addressObject } : {})
    };
  }
} 