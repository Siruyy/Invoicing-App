import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

// Services and Models
import { InvoiceService } from '../../core/services/invoice.service';
import { ClientService } from '../../core/services/client.service';
import { MessageService } from 'primeng/api';
import { Invoice, InvoiceStatus } from '../../core/models/invoice.model';

// Shared Components
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-invoice-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    DropdownModule,
    InputTextareaModule,
    ButtonModule,
    ToastModule,
    TableModule,
    TagModule,
    RippleModule,
    TooltipModule,
    CardComponent,
    ButtonComponent
  ],
  providers: [MessageService],
  template: `
    <div class="invoice-form-container">
      <div class="invoice-header">
        <h1>Invoice Details {{ invoice?.status ? '(' + invoice?.status + ')' : '' }}</h1>
        <div class="flex gap-2">
          <button pButton type="button" label="Edit" icon="pi pi-pencil" class="p-button-primary action-button" (click)="editInvoice()"></button>
          <button pButton type="button" label="Back to Invoices" icon="pi pi-arrow-left" class="p-button-secondary action-button" routerLink="/invoices"></button>
        </div>
      </div>

      <div *ngIf="loading" class="flex justify-center py-8">
        <p>Loading invoice...</p>
      </div>
      
      <div *ngIf="!loading && invoice" class="invoice-content">
        <div class="invoice-form-grid">
          <!-- Left column: Client information -->
          <div class="invoice-section">
            <h2 class="section-title">Billed to</h2>
            <div class="section-content">
              <div class="form-group">
                <label>Client Name</label>
                <div class="field-display">{{ getClientName() }}</div>
              </div>
              
              <div class="form-group">
                <label>Company Name</label>
                <div class="field-display">{{ getCompanyName() }}</div>
              </div>
              
              <div class="form-group">
                <label>Address</label>
                <div class="field-display">{{ getCompanyAddress() }}</div>
              </div>
            </div>
          </div>
          
          <!-- Right column: Invoice information -->
          <div class="invoice-section">
            <h2 class="section-title">Invoice Information</h2>
            <div class="section-content">
              <div class="form-group">
                <label>Invoice number</label>
                <div class="field-display">{{ invoice.invoiceNumber }}</div>
              </div>
              
              <div class="form-group">
                <label>Invoice date</label>
                <div class="field-display">{{ invoice.issueDate | date }}</div>
              </div>
              
              <div class="form-group">
                <label>Due date</label>
                <div class="field-display">{{ invoice.dueDate | date }}</div>
              </div>
              
              <div class="invoice-total">
                <div>Invoice of ( {{ invoice.currency || 'USD' }} )</div>
                <div class="total-amount">{{ invoice.totalAmount | currency }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="section-divider"></div>
        
        <!-- Invoice Items Section -->
        <div class="invoice-items-section">
          <h2 class="section-title">Items & Services</h2>
          <div class="invoice-items-header">
            <div class="item-col-desc">ITEM/SERVICE</div>
            <div class="item-col-qty">QTY</div>
            <div class="item-col-price">RATE/UNIT PRICE</div>
            <div class="item-col-total">AMOUNT</div>
          </div>
          
          <div class="invoice-items-list">
            <div *ngFor="let item of invoice?.items || []" class="invoice-item">
              <div class="item-col-desc">{{ item.description }}</div>
              <div class="item-col-qty">{{ item.quantity }}</div>
              <div class="item-col-price">{{ item.unitPrice | currency }}</div>
              <div class="item-col-total">{{ item.quantity * item.unitPrice | currency }}</div>
            </div>
            
            <div *ngIf="!invoice?.items?.length" class="no-items">
              No items found for this invoice
            </div>
          </div>
          
          <!-- Invoice Summary -->
          <div class="invoice-summary">
            <div class="summary-row">
              <div class="summary-label">Subtotal</div>
              <div class="summary-value">{{ invoice.subtotal | currency }}</div>
            </div>
            <div class="summary-row">
              <div class="summary-label">Tax {{ invoice.taxRate ? '(' + invoice.taxRate + '%)' : '' }}</div>
              <div class="summary-value">{{ invoice.taxAmount | currency }}</div>
            </div>
            <div class="summary-row total">
              <div class="summary-label">Total</div>
              <div class="summary-value">{{ invoice.totalAmount | currency }}</div>
            </div>
          </div>
        </div>
        <div class="section-divider"></div>
        
        <!-- Notes Section -->
        <div *ngIf="invoice.notes" class="notes-section">
          <h2 class="section-title">Notes</h2>
          <div class="notes-content">{{ invoice.notes }}</div>
        </div>
        
        <!-- Payment Status Section -->
        <div class="payment-status-section">
          <h2 class="section-title">Payment Status</h2>
          <div class="status-container">
            <p-tag [value]="invoice.status || ''" [severity]="invoice.status ? getStatusSeverity(invoice.status) : 'info'"></p-tag>
            <div *ngIf="invoice.status === 'PAID'" class="paid-date">
              Paid on: {{ invoice.paidAt | date }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .invoice-form-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
    }
    
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid var(--surface-border);
    }
    
    .action-button {
      border-radius: 8px !important;
      padding: 0.5rem 1rem !important;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .invoice-header h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-color);
      margin: 0;
    }
    
    .invoice-content {
      background-color: var(--surface-card);
      border-radius: 6px;
      padding: 2rem;
      box-shadow: 0 2px 1px -1px rgba(0,0,0,0.1), 0 1px 1px 0 rgba(0,0,0,0.07), 0 1px 3px 0 rgba(0,0,0,0.06);
    }
    
    .invoice-form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    .invoice-section h2 {
      font-size: 1.25rem;
      margin-top: 0;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    .form-group label {
      display: block;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      color: var(--text-color-secondary);
    }
    
    .field-display {
      padding: 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: 4px;
      background-color: var(--surface-ground);
      color: var(--text-color);
    }
    
    .invoice-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
    }
    
    .total-amount {
      font-size: 1.75rem;
      font-weight: bold;
      color: var(--primary-color);
    }
    
    .invoice-items-section {
      margin-top: 2rem;
      border-top: 1px solid var(--surface-border);
      padding-top: 2rem;
    }
    
    .invoice-items-header {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 1fr;
      gap: 1rem;
      padding: 0.5rem 0;
      font-weight: bold;
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      border-bottom: 1px solid var(--surface-border);
    }
    
    .invoice-items-list {
      margin: 1rem 0 2rem;
    }
    
    .invoice-item {
      display: grid;
      grid-template-columns: 3fr 1fr 1fr 1fr;
      gap: 1rem;
      padding: 1rem 0;
      border-bottom: 1px solid var(--surface-border);
    }
    
    .item-col-price, .item-col-total, .item-col-qty {
      text-align: right;
    }
    
    .no-items {
      padding: 2rem 0;
      text-align: center;
      color: var(--text-color-secondary);
    }
    
    .invoice-summary {
      margin-left: auto;
      width: 40%;
      max-width: 300px;
    }
    
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }
    
    .summary-row.total {
      font-weight: bold;
      font-size: 1.1rem;
      border-top: 1px solid var(--surface-border);
      padding-top: 1rem;
      margin-top: 0.5rem;
    }
    
    .notes-section {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--surface-border);
    }
    
    .notes-section h3 {
      margin-top: 0;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      font-weight: 500;
    }
    
    .notes-content {
      padding: 1rem;
      background-color: var(--surface-ground);
      border-radius: 4px;
      white-space: pre-line;
    }
    
    .payment-status-section {
      margin-top: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .paid-date {
      color: var(--text-color-secondary);
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      .invoice-form-grid {
        grid-template-columns: 1fr;
      }
      
      .invoice-summary {
        width: 100%;
        max-width: none;
      }
    }
  `]
})
export class InvoiceViewComponent implements OnInit {
  invoice: Invoice | null = null;
  loading = true;
  invoiceId!: number;

  constructor(
    private invoiceService: InvoiceService,
    private clientService: ClientService,
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.invoiceId = +id;
        this.loadInvoice(+id);
      } else {
        this.router.navigate(['/invoices']);
      }
    });
  }

  loadInvoice(id: number): void {
    this.loading = true;
    this.invoiceService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading invoice', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load invoice. Please try again.'
        });
        this.loading = false;
        this.router.navigate(['/invoices']);
      }
    });
  }

  getClientName(): string {
    if (!this.invoice) return 'N/A';
    
    if (this.invoice.client && typeof this.invoice.client !== 'number') {
      return this.invoice.client.name || 'Unknown';
    }
    
    return 'Unknown';
  }
  
  getCompanyName(): string {
    if (!this.invoice) return 'N/A';
    
    // First try to get it directly from invoice
    if (this.invoice.companyName) {
      return this.invoice.companyName;
    }
    
    // Then try to get it from client object if available
    if (this.invoice.client && typeof this.invoice.client !== 'number' && this.invoice.client.companyName) {
      return this.invoice.client.companyName;
    }
    
    return 'N/A';
  }
  
  getCompanyAddress(): string {
    if (!this.invoice) return 'N/A';
    
    // First try to get it directly from invoice
    if (this.invoice.companyAddress) {
      return this.invoice.companyAddress;
    }
    
    // Then try to get it from client object if available
    if (this.invoice.client && typeof this.invoice.client !== 'number') {
      // Check if address is an object with street property
      if (this.invoice.client.address && typeof this.invoice.client.address === 'object' && 'street' in this.invoice.client.address) {
        const addr = this.invoice.client.address;
        return `${addr.street}, ${addr.city}, ${addr.state || ''} ${addr.zipCode}, ${addr.country}`.trim();
      }
      
      // Check if address is a string
      if (this.invoice.client.address && typeof this.invoice.client.address === 'string') {
        return this.invoice.client.address;
      }
      
      // Try to construct address from individual fields
      if (this.invoice.client.city) {
        const parts = [
          this.invoice.client.city,
          this.invoice.client.state,
          this.invoice.client.zipCode,
          this.invoice.client.country
        ].filter(Boolean);
        
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
    }
    
    return 'N/A';
  }

  editInvoice(): void {
    this.router.navigate(['/invoices', this.invoiceId, 'edit']);
  }

  // Helper for status coloring
  getStatusSeverity(status: InvoiceStatus): 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'contrast' | undefined {
    switch(status) {
      case InvoiceStatus.DRAFT: return 'info';
      case InvoiceStatus.PENDING: return 'warning';
      case InvoiceStatus.PAID: return 'success';
      case InvoiceStatus.OVERDUE: return 'danger';
      case InvoiceStatus.CANCELLED: return 'secondary';
      default: return 'info';
    }
  }
}
