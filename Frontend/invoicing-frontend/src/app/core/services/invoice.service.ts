import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Invoice, InvoiceStatus } from '../models/invoice.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  constructor(private api: ApiService) { }

  getInvoices(
    page: number = 1,
    limit: number = 10,
    status?: InvoiceStatus,
    clientId?: number,
    search?: string,
    includeDrafts: boolean = true,
    startDate?: Date,
    endDate?: Date,
    sortField?: string,
    sortOrder?: number
  ): Observable<{ items: Invoice[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('includeDrafts', includeDrafts.toString());

    if (status) {
      params = params.set('status', this.mapStatusToBackend(status).toString());
    }
    if (clientId) {
      params = params.set('clientId', clientId.toString());
    }
    if (search) {
      params = params.set('search', search);
    }
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }
    if (sortField) {
      params = params.set('sortField', sortField);
    }
    if (typeof sortOrder === 'number') {
      params = params.set('sortOrder', sortOrder.toString());
    }
    
    return this.api.get<any>('/invoices', params).pipe(
      map(response => {
        // Handle different response formats: array or object with items property
        let items = [];
        let total = 0;
        
        if (Array.isArray(response)) {
          // Response is an array of invoices
          items = response;
          total = response.length;
        } else if (response && response.items && Array.isArray(response.items)) {
          // Response has items property which is an array
          items = response.items;
          total = response.total || items.length;
        } else if (!response) {
          return { items: [], total: 0 };
        } else {
          return { items: [], total: 0 };
        }
        
        // Map numeric status values to string enum values
        const mappedItems = items.map((item: any) => {
          if (!item) return null;
          
          // Process the invoice data
          const processedItem = {
            ...item,
            // Map backend to frontend properties
            status: item.status !== undefined ? this.mapStatusFromBackend(item.status) : InvoiceStatus.DRAFT,
            // Ensure total is set for backward compatibility
            total: item.totalAmount || item.total || 0
          };
          
          // Debug client data
          if (typeof processedItem.client === 'undefined' || processedItem.client === null) {
            if (processedItem.clientId) {
              // Client ID exists but no client object
            }
          }
          
          return processedItem;
        }).filter((item: any) => item !== null);
        
        return {
          items: mappedItems,
          total: total || mappedItems.length
        };
      })
    );
  }
  
  // Helper method to map numeric status from backend to frontend string enum
  private mapStatusFromBackend(status: number): InvoiceStatus {
    switch(status) {
      case 0: return InvoiceStatus.DRAFT;
      case 1: return InvoiceStatus.PENDING;
      case 2: return InvoiceStatus.PAID;
      case 3: return InvoiceStatus.OVERDUE;
      case 4: return InvoiceStatus.CANCELLED;
      default: return InvoiceStatus.DRAFT;
    }
  }
  
  // Helper method to map frontend string enum to numeric status for backend
  private mapStatusToBackend(status: InvoiceStatus): number {
    switch(status) {
      case InvoiceStatus.DRAFT: return 0;
      case InvoiceStatus.PENDING: return 1;
      case InvoiceStatus.PAID: return 2;
      case InvoiceStatus.OVERDUE: return 3;
      case InvoiceStatus.CANCELLED: return 4;
      default: return 0;
    }
  }

  getInvoiceById(id: number): Observable<Invoice> {
    return this.api.get<any>(`/invoices/${id}`).pipe(
      map(invoice => {
        if (!invoice) {
          throw new Error('Invoice not found');
        }
        return {
          ...invoice,
          status: invoice.status !== undefined ? this.mapStatusFromBackend(invoice.status) : InvoiceStatus.DRAFT
        };
      })
    );
  }
  
  getRecentInvoices(limit: number = 5): Observable<Invoice[]> {
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', limit.toString())
      .set('sortBy', 'issueDate')
      .set('sortOrder', 'desc');
      
    return this.api.get<any>('/invoices', params).pipe(
      map(response => {
        let items: Invoice[] = [];
        
        if (Array.isArray(response)) {
          items = response;
        } else if (response && response.items) {
          items = response.items;
        }
        
        return items.map(invoice => {
          // Add clientName property derived from the client object or fallback to 'Unknown'
          let clientName = 'Unknown';
          
          if (invoice.client && typeof invoice.client !== 'number') {
            // Use the client name as the primary identifier
            clientName = invoice.client.name || 'Unknown';
          }
            
          return {
            ...invoice,
            clientName: clientName,
            status: typeof invoice.status === 'number' ? this.mapStatusFromBackend(invoice.status) : invoice.status || InvoiceStatus.DRAFT
          };
        });
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    // Map the status to numeric value for the backend
    const mappedInvoice = {
      ...invoice,
      status: this.mapStatusToBackend(invoice.status || InvoiceStatus.DRAFT)
    };
    
    return this.api.post<any>('/invoices', mappedInvoice).pipe(
      map(response => {
        if (!response) {
          // Return a default structure with the invoice data
          return {
            ...invoice,
            id: 0  // We don't know the ID yet
          };
        }
        return {
          ...response,
          status: response.status !== undefined ? this.mapStatusFromBackend(response.status) : invoice.status || InvoiceStatus.DRAFT
        };
      })
    );
  }

  updateInvoice(id: number, invoice: Invoice): Observable<Invoice> {
    // Map the status to numeric value for the backend
    const mappedInvoice = {
      ...invoice,
      status: this.mapStatusToBackend(invoice.status || InvoiceStatus.DRAFT)
    };
    
    return this.api.put<any>(`/invoices/${id}`, mappedInvoice).pipe(
      map(response => {
        // The update endpoint returns 204 No Content
        // So we just return the original invoice with its ID
        return {
          ...invoice,
          id: id
        };
      }),
      catchError(error => {
        // Return the original invoice anyway to prevent UI errors
        return of({
          ...invoice,
          id: id
        });
      })
    );
  }

  deleteInvoice(id: number): Observable<void> {
    return this.api.delete<void>(`/invoices/${id}`);
  }
  
  updateInvoiceStatus(id: number, status: InvoiceStatus): Observable<Invoice> {
    // Map the status to numeric value for the backend
    const mappedStatus = this.mapStatusToBackend(status);
    return this.api.put<any>(`/invoices/${id}/status`, { 
      id: id,  // Include the ID in the request body
      status: mappedStatus,
      paidAt: status === InvoiceStatus.PAID ? new Date().toISOString() : null
    }).pipe(
      map(response => {
        return {
          ...response,
          status: this.mapStatusFromBackend(response.status)
        };
      })
    );
  }
  
  generateInvoicePdf(id: number): Observable<Blob> {
    return this.api.get<Blob>(`/invoices/${id}/pdf`);
  }

  generateInvoiceNumber(): Observable<string> {
    // Call the backend API to generate an invoice number
    return this.api.get<{invoiceNumber: string}>('/invoices/generate-number')
      .pipe(
        map(response => response.invoiceNumber)
      );
  }
  
  sendInvoiceEmail(id: number, recipientEmail: string): Observable<void> {
    // Match the backend model property name
    return this.api.post<void>(`/invoices/${id}/send`, { recipientEmail: recipientEmail });
  }
  
  downloadInvoicePdf(id: number): Observable<Blob> {
    return this.api.getBlob(`/invoices/${id}/pdf`);
  }
  
  /**
   * Import invoices from CSV file
   * @param file The CSV file to import
   * @returns Observable with import result
   */
  importInvoicesFromCsv(file: File): Observable<{ imported: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.api.post<{ imported: number }>('/invoices/import', formData);
  }
  
  /**
   * Export invoices to CSV
   * @param ids Array of invoice IDs to export (empty for all invoices)
   * @returns Observable with CSV blob
   */
  exportInvoicesToCsv(ids: number[] = []): Observable<Blob> {
    let params = new HttpParams();
    
    if (ids.length > 0) {
      params = params.set('ids', ids.join(','));
    }
    
    // Use our getBlob method
    return this.api.getBlob('/invoices/export', params);
  }
} 