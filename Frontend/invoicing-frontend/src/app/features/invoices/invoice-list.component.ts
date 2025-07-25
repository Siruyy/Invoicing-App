import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardComponent } from '../../shared/components/card/card.component';
import { SafeClientPipe } from '../../shared/pipes/safe-client.pipe';

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
    SafeClientPipe
  ],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit {
  invoices: Invoice[] = [];
  loading = true;

  // filter state
  statusFilter: InvoiceStatus | null = null;
  startDateFilter: Date | null = null;
  endDateFilter: Date | null = null;
  globalSearch = '';

  statusOptions = [
    { label: 'All', value: null },
    { label: 'Draft', value: InvoiceStatus.DRAFT },
    { label: 'Pending', value: InvoiceStatus.PENDING },
    { label: 'Paid', value: InvoiceStatus.PAID },
    { label: 'Overdue', value: InvoiceStatus.OVERDUE }
  ];

  totalRecords = 0;
  currentPage = 1;
  rowsPerPage = 10;
  first = 0; // Added for PrimeNG pagination - tracks the first record index

  constructor(
    private router: Router,
    private invoiceService: InvoiceService
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
    
    console.log(`Loading invoices for page ${page}, limit ${limit}, first: ${this.first}`);
    
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
        
        console.log('Loaded invoices:', this.invoices);
        console.log('Total records:', this.totalRecords);
        console.log('Current filters:', {
          status: this.statusFilter,
          startDate: this.startDateFilter,
          endDate: this.endDateFilter,
          search: this.globalSearch
        });
      },
      error: (error) => {
        console.error('Failed to load invoices:', error);
        this.loading = false;
        this.invoices = [];
      }
    });
  }

  goTo(inv: Invoice) {
    this.router.navigate(['/invoices', inv.id, 'edit']);
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
    console.log('Page change event:', event);
    
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
    
    console.log(`Setting page to ${this.currentPage}, rows to ${this.rowsPerPage}`);
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
} 