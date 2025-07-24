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

  constructor(private router: Router) {}

  ngOnInit(): void {
    // mock data for now
    this.invoices = this.generateMockInvoices();
    this.loading = false;
  }

  goTo(inv: Invoice) {
    this.router.navigate(['/invoices', inv.id]);
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

  private generateMockInvoices(): Invoice[] {
    const list: Invoice[] = [];
    const statuses = [
      InvoiceStatus.DRAFT,
      InvoiceStatus.PENDING,
      InvoiceStatus.PAID,
      InvoiceStatus.OVERDUE
    ];

    for (let i = 1; i <= 25; i++) {
      const issue = new Date();
      issue.setDate(issue.getDate() - i);
      const due = new Date(issue);
      due.setDate(issue.getDate() + 30);

      list.push({
        id: i,
        invoiceNumber: `INV-${String(i).padStart(5, '0')}`,
        client: {
          id: i,
          name: `Client ${i}`
        } as any,
        issueDate: issue,
        dueDate: due,
        status: statuses[i % statuses.length],
        items: [],
        total: 250 * i
      } as Invoice);
    }
    return list;
  }
} 