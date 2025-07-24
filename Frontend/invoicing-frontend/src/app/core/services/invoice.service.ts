import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';
import { Invoice, InvoiceStatus } from '../models/invoice.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  constructor(private api: ApiService) { }

  getInvoices(page: number = 1, limit: number = 10, status?: InvoiceStatus, clientId?: number, search?: string): Observable<{ items: Invoice[], total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (status) {
      params = params.set('status', status);
    }
    
    if (clientId) {
      params = params.set('clientId', clientId.toString());
    }
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.api.get<{ items: Invoice[], total: number }>('/invoices', params);
  }

  getInvoiceById(id: number): Observable<Invoice> {
    return this.api.get<Invoice>(`/invoices/${id}`);
  }

  createInvoice(invoice: Invoice): Observable<Invoice> {
    return this.api.post<Invoice>('/invoices', invoice);
  }

  updateInvoice(id: number, invoice: Invoice): Observable<Invoice> {
    return this.api.put<Invoice>(`/invoices/${id}`, invoice);
  }

  deleteInvoice(id: number): Observable<void> {
    return this.api.delete<void>(`/invoices/${id}`);
  }
  
  updateInvoiceStatus(id: number, status: InvoiceStatus): Observable<Invoice> {
    return this.api.patch<Invoice>(`/invoices/${id}/status`, { status });
  }
  
  markAsPaid(id: number): Observable<Invoice> {
    return this.updateInvoiceStatus(id, InvoiceStatus.PAID);
  }
  
  generateInvoicePdf(id: number): Observable<Blob> {
    return this.api.get<Blob>(`/invoices/${id}/pdf`);
  }

  generateInvoiceNumber(): Observable<string> {
    // Call the backend API to generate an invoice number
    return this.api.get<string>('/invoices/generate-number');
    
    // Fallback if API is not available yet
    // return of(`INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`);
  }

  saveDraft(invoice: Invoice): Observable<Invoice> {
    return this.api.post<Invoice>('/invoices/drafts', invoice);
  }
} 