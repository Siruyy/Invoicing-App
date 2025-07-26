import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

// PrimeNG
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardComponent } from '../../shared/components/card/card.component';
import { SafeClientPipe } from '../../shared/pipes/safe-client.pipe';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';

import { Invoice, InvoiceStatus } from '../../core/models/invoice.model';
import { InvoiceService } from '../../core/services/invoice.service';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    DropdownModule,
    CalendarModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    CardComponent,
    SafeClientPipe,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    FileUploadModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = [];
  loading = true;
  
  // Import/Export related properties
  showImportDialog: boolean = false;
  uploadedFile: File | null = null;
  importInProgress: boolean = false;

  // filter state
  statusFilter: InvoiceStatus | null = null;
  startDateFilter: Date | null = null;
  endDateFilter: Date | null = null;
  globalSearch = '';

  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Draft', value: InvoiceStatus.DRAFT, styleClass: 'status-draft' },
    { label: 'Pending', value: InvoiceStatus.PENDING, styleClass: 'status-pending' },
    { label: 'Paid', value: InvoiceStatus.PAID, styleClass: 'status-paid' },
    { label: 'Overdue', value: InvoiceStatus.OVERDUE, styleClass: 'status-overdue' }
  ];

  totalRecords = 0;
  currentPage = 1;
  rowsPerPage = 10;
  first = 0; // Added for PrimeNG pagination - tracks the first record index

  constructor(
    private router: Router,
    private invoiceService: InvoiceService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Initialize pagination properly
    this.first = 0;
    this.currentPage = 1;
    this.loadInvoices();
  }
  
  loadInvoices(): void {
    this.loading = true;
    
    // Ensure we have valid values
    const page = isNaN(this.currentPage) ? 1 : this.currentPage;
    const limit = isNaN(this.rowsPerPage) ? 10 : this.rowsPerPage;
    
    // Make sure first is in sync with currentPage
    this.first = (page - 1) * limit;
    
    this.invoiceService.getInvoices(
      page,
      limit,
      this.statusFilter || undefined,
      undefined,
      this.globalSearch || undefined,
      true, // include draft invoices
      this.startDateFilter || undefined,
      this.endDateFilter || undefined
    ).subscribe({
      next: (response) => {
        this.invoices = response.items;
        this.totalRecords = response.total;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.invoices = [];
        this.messageService.add({
          severity: 'error',
          summary: 'Load Failed',
          detail: 'Failed to load invoices'
        });
      }
    });
  }

  // Removed the goTo method as we no longer want clicking the row to navigate

  editInvoice(invoice: Invoice) {
    this.router.navigate(['/invoices', invoice.id, 'edit']);
  }

  viewInvoice(invoice: Invoice) {
    this.router.navigate(['/invoices', invoice.id, 'view']);
  }

  canDeleteInvoice(status: InvoiceStatus): boolean {
    return status === InvoiceStatus.DRAFT || status === InvoiceStatus.PENDING;
  }

  confirmDelete(invoice: Invoice, event: Event) {
    event.stopPropagation(); // Prevent row click event

    if (!this.canDeleteInvoice(invoice.status)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Cannot Delete',
        detail: 'Only draft and pending invoices can be deleted'
      });
      return;
    }

    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Are you sure you want to delete invoice ${invoice.invoiceNumber}?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.deleteInvoice(invoice);
      }
    });
  }

  deleteInvoice(invoice: Invoice) {
    this.loading = true;
    this.invoiceService.deleteInvoice(invoice.id!).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Invoice Deleted',
          detail: `Invoice ${invoice.invoiceNumber} has been deleted successfully`
        });
        this.loadInvoices(); // Reload the list
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: 'An error occurred while deleting the invoice'
        });
        this.loading = false;
      }
    });
  }

  // Filter and pagination handlers
  onStatusChange(): void {
    this.currentPage = 1; // Reset to first page when filter changes
    this.first = 0;       // Reset PrimeNG pagination position
    this.loadInvoices();
  }
  
  onDateFilterChange(): void {
    this.currentPage = 1;
    this.first = 0;       // Reset PrimeNG pagination position
    this.loadInvoices();
  }
  
  onSearchChange(): void {
    this.currentPage = 1;
    this.first = 0;       // Reset PrimeNG pagination position
    this.loadInvoices();
  }
  
  onPageChange(event: any): void {
    // PrimeNG pagination sends 'first' (starting index) and 'rows' (page size)
    // Calculate the page number from the first index and rows
    const rows = event.rows !== undefined ? Number(event.rows) : 10;
    let page;
    
    if (event.first !== undefined) {
      // Calculate page from first index (0-based to 1-based)
      page = Math.floor(event.first / rows) + 1;
    } else if (event.page !== undefined) {
      // Some versions might send page directly (0-based to 1-based)
      page = Number(event.page) + 1;
    } else {
      page = 1;
    }
    
    this.currentPage = isNaN(page) ? 1 : page;
    this.rowsPerPage = isNaN(rows) ? 10 : rows;
    
    this.loadInvoices();
  }

  // --- helpers -------------------------------------------------------------
  getStatusSeverity(status: InvoiceStatus) {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'success';
      case InvoiceStatus.PENDING:
        return 'warning';
      case InvoiceStatus.OVERDUE:
        return 'danger';
      case InvoiceStatus.DRAFT:
        return 'info';
      default:
        return 'info';
    }
  }
  
  // Export invoices to CSV
  exportInvoices(): void {
    // Show loading message
    this.messageService.add({
      severity: 'info',
      summary: 'Export',
      detail: 'Preparing invoice export...',
      life: 2000
    });

    // Direct approach: open the URL in a new tab/window
    const exportUrl = `${environment.apiUrl}/invoices/export`;
    window.open(exportUrl, '_blank');
    
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Export started. If download doesn\'t begin automatically, check your browser settings.'
    });
  }
  
  // Import Dialog Methods
  openImportDialog(): void {
    this.uploadedFile = null;
    this.showImportDialog = true;
  }
  
  closeImportDialog(): void {
    this.showImportDialog = false;
    this.uploadedFile = null;
  }
  
  onFileSelected(event: any): void {
    if (event.files && event.files.length > 0) {
      this.uploadedFile = event.files[0];
    }
  }
  
  importInvoices(): void {
    if (!this.uploadedFile) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select a CSV file to import'
      });
      return;
    }
    
    this.importInProgress = true;
    
    this.invoiceService.importInvoicesFromCsv(this.uploadedFile).subscribe({
      next: (result) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Successfully imported ${result.imported} invoices`
        });
        this.closeImportDialog();
        this.loadInvoices(); // Reload the invoice list
        this.importInProgress = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to import invoices'
        });
        this.importInProgress = false;
      }
    });
  }
} 