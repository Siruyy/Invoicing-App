import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InvoiceService } from '../../core/services/invoice.service';
import { Invoice, InvoiceStatus } from '../../core/models/invoice.model';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    TagModule,
    ButtonModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  template: `<div class="p-8 text-center">Invoice Detail Works</div>`,
  styles: `
    .invoice-detail-container {
      max-width: 100%;
      margin: 0 auto;
    }
    
    .primary-button {
      padding: 0.625rem 1rem;
      background-color: var(--green-600, #16a34a);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    
    .primary-button:hover {
      background-color: var(--green-700, #15803d);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    
    .secondary-button {
      padding: 0.625rem 1rem;
      background-color: white;
      color: var(--gray-700);
      border: 1px solid var(--gray-300);
      border-radius: 0.5rem;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    
    .secondary-button:hover {
      background-color: var(--gray-50);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    
    .dark .secondary-button {
      background-color: var(--gray-800);
      color: white;
      border-color: var(--gray-700);
    }
    
    .dark .secondary-button:hover {
      background-color: var(--gray-700);
    }
    
    :host ::ng-deep .p-tag {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
    }
    
    :host ::ng-deep .p-button {
      border-radius: 0.5rem !important;
    }
  `
})
export class InvoiceDetailComponent implements OnInit {
  invoice: Invoice | null = null;
  loading = true;
  error: string | null = null;
  
  // Expose InvoiceStatus enum to the template
  InvoiceStatus = InvoiceStatus;

  constructor(
    private invoiceService: InvoiceService,
    private route: ActivatedRoute,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id) {
        this.loadInvoice(id);
      }
    });
  }

  loadInvoice(id: number): void {
    this.loading = true;
    this.error = null;
    
    this.invoiceService.getInvoiceById(id).subscribe({
      next: (invoice) => {
        this.invoice = invoice;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Unable to load invoice. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  markAsPaid(): void {
    if (!this.invoice?.id) return;
    
    this.invoiceService.updateInvoiceStatus(this.invoice.id, InvoiceStatus.PAID).subscribe({
      next: (updatedInvoice) => {
        this.invoice = updatedInvoice;
        this.messageService.add({
          severity: 'success',
          summary: 'Invoice Updated',
          detail: 'Invoice has been marked as paid successfully.'
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to mark invoice as paid. Please try again.'
        });
      }
    });
  }
  
  sendInvoice(): void {
    // This would typically call an API to send the invoice via email
    // For now, just change status to PENDING
    if (!this.invoice?.id) return;
    
    this.invoiceService.updateInvoiceStatus(this.invoice.id, InvoiceStatus.PENDING).subscribe({
      next: (updatedInvoice) => {
        this.invoice = updatedInvoice;
        this.messageService.add({
          severity: 'success',
          summary: 'Invoice Sent',
          detail: 'Invoice has been sent to the client.'
        });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send invoice. Please try again.'
        });
      }
    });
  }
  
  confirmDelete(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this invoice?',
      accept: () => this.deleteInvoice()
    });
  }
  
  deleteInvoice(): void {
    if (!this.invoice?.id) return;
    
    this.invoiceService.deleteInvoice(this.invoice.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Invoice Deleted',
          detail: 'Invoice has been deleted successfully.'
        });
        // Navigate back to invoice list
        setTimeout(() => this.router.navigate(['/invoices']), 1000);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete invoice. Please try again.'
        });
      }
    });
  }
  
  downloadPdf(): void {
    if (!this.invoice?.id) return;
    
    this.invoiceService.generateInvoicePdf(this.invoice.id).subscribe({
      next: (blob) => {
        // Create a download link and click it
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${this.invoice?.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to generate PDF. Please try again.'
        });
      }
    });
  }
  
  getStatusSeverity(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'success';
      case InvoiceStatus.PENDING:
        return 'warning';
      case InvoiceStatus.OVERDUE:
        return 'danger';
      case InvoiceStatus.DRAFT:
        return 'info';
      case InvoiceStatus.CANCELLED:
        return 'secondary';
      default:
        return 'info';
    }
  }
} 