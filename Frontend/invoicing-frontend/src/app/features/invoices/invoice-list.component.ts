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
    CardComponent
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

  constructor(
    private router: Router,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
  }
  
  loadInvoices(): void {
    this.loading = true;
    this.invoiceService.getInvoices(
      this.currentPage,
      this.rowsPerPage,
      this.statusFilter || undefined,
      undefined,
      this.globalSearch || undefined
    ).subscribe({
      next: (response) => {
        this.invoices = response.items;
        this.totalRecords = response.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load invoices:', error);
        this.loading = false;
        this.invoices = [];
      }
    });
  }

  goTo(inv: Invoice) {
    this.router.navigate(['/invoices', inv.id]);
  }

  // Filter and pagination handlers
  onStatusChange(): void {
    this.currentPage = 1; // Reset to first page when filter changes
    this.loadInvoices();
  }
  
  onDateFilterChange(): void {
    this.currentPage = 1;
    this.loadInvoices();
  }
  
  onSearchChange(): void {
    this.currentPage = 1;
    this.loadInvoices();
  }
  
  onPageChange(event: any): void {
    this.currentPage = event.page + 1; // PrimeNG uses 0-based indexing
    this.rowsPerPage = event.rows;
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