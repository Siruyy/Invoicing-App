import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Shared Components
import { CardComponent } from '../../shared/components/card/card.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

// Services
import { DashboardService } from '../../core/services/dashboard.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, KpiCardComponent, ButtonComponent],
  template: `
    <div class="dashboard-container">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Overview of your invoicing activity</p>
        </div>
        <div class="flex space-x-3">
          <button 
            class="action-button"
            routerLink="/invoices/new"
          >
            New Invoice
          </button>
          <button 
            class="action-button"
            routerLink="/clients/new"
          >
            New Client
          </button>
        </div>
      </div>
      
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <app-kpi-card
          title="Total Revenue"
          [value]="dashboardData?.totalRevenue ?? 0"
          prefix="$"
          icon="pi-dollar"
          [change]="revenueChange"
          subtitle="Last 30 days"
          [loading]="loading"
        ></app-kpi-card>
        
        <app-kpi-card
          title="Outstanding Amount"
          [value]="dashboardData?.overdueAmount ?? 0"
          prefix="$"
          icon="pi-credit-card"
          [change]="overdueChange"
          [subtitle]="dashboardData?.unpaidInvoicesCount + ' unpaid invoices'"
          [loading]="loading"
          [negative]="true"
        ></app-kpi-card>
        
        <app-kpi-card
          title="Invoices Created"
          [value]="dashboardData?.paidInvoicesCount + dashboardData?.unpaidInvoicesCount ?? 0"
          icon="pi-file"
          [change]="invoicesChange"
          subtitle="Last 30 days"
          [loading]="loading"
        ></app-kpi-card>
        
        <app-kpi-card
          title="Average Value"
          [value]="averageInvoiceValue"
          prefix="$"
          format="1.0-0"
          icon="pi-chart-bar"
          [change]="valueChange"
          subtitle="Per invoice"
          [loading]="loading"
        ></app-kpi-card>
      </div>
      
      
      <!-- Recent Invoices -->
      <app-card 
        title="Recent Invoices"
        subtitle="Last 5 invoices created"
      >
        <div *ngIf="loading" class="text-center py-16 text-gray-500 dark:text-gray-400">
          <p>Loading invoices...</p>
        </div>
        <div *ngIf="!loading && (!recentInvoices || recentInvoices.length === 0)" class="text-center py-16 text-gray-500 dark:text-gray-400">
          <p class="mb-4">No recent invoices found</p>
          <app-button 
            label="Create New Invoice" 
            variant="primary"
            routerLink="/invoices/new"
          ></app-button>
        </div>
        <div *ngIf="!loading && recentInvoices && recentInvoices.length > 0">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice #</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Client</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let invoice of recentInvoices">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a [routerLink]="['/invoices', invoice.id]" class="text-blue-600 dark:text-blue-400 hover:underline">
                    {{ invoice.invoiceNumber }}
                  </a>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ invoice.clientName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ invoice.issueDate | date }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ invoice.totalAmount | currency }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': invoice.status === 'Paid',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': invoice.status === 'Pending',
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': invoice.status === 'Overdue',
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300': invoice.status === 'Draft',
                    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300': invoice.status === 'PartiallyPaid'
                  }" class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ invoice.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="mt-4 text-center">
            <app-button 
              label="View All Invoices" 
              variant="secondary"
              routerLink="/invoices"
            ></app-button>
          </div>
        </div>
      </app-card>
    </div>
  `,
  styles: `
    .dashboard-container {
      max-width: 100%;
      margin: 0 auto;
    }
    
    .action-button {
      padding: 0.625rem 1rem;
      background-color: var(--green-600, #16a34a);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    
    .action-button:hover {
      background-color: var(--green-700, #15803d);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    
    .action-button:active {
      transform: scale(1.05);
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    }
  `
})
export class DashboardComponent implements OnInit {
  loading = true;
  dashboardData: any = null;
  recentInvoices: any[] = [];
  
  // For KPI trends
  revenueChange = 0;
  overdueChange = 0;
  invoicesChange = 0;
  valueChange = 0;
  averageInvoiceValue = 0;

  constructor(
    private dashboardService: DashboardService,
    private invoiceService: InvoiceService
  ) { }

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    this.loading = true;
    
    forkJoin({
      dashboardData: this.dashboardService.getDashboardData()
        .pipe(catchError(() => of(null))),
      recentInvoices: this.invoiceService.getRecentInvoices(5)
        .pipe(catchError(() => of([])))
    }).subscribe({
      next: (results) => {
        this.dashboardData = results.dashboardData;
        this.recentInvoices = results.recentInvoices;
        
        // Calculate derived metrics
        this.calculateDerivedMetrics();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
        this.loading = false;
      }
    });
  }

  calculateDerivedMetrics(): void {
    // Use the dynamic values from the backend
    if (this.dashboardData) {
      console.log('Dashboard data received:', this.dashboardData);
      
      // Use backend-provided average invoice value
      this.averageInvoiceValue = this.dashboardData.averageInvoiceValue || 0;
      console.log('Average invoice value:', this.averageInvoiceValue);
      
      // Use backend-calculated trend values
      this.revenueChange = this.dashboardData.revenueChange || 0;
      this.overdueChange = this.dashboardData.overdueAmountChange || 0;  // Negative is better for overdue amounts
      this.invoicesChange = this.dashboardData.invoicesCreatedChange || 0;
      this.valueChange = this.dashboardData.averageValueChange || 0;
      
      console.log('Trend values:', {
        revenueChange: this.revenueChange,
        overdueChange: this.overdueChange,
        invoicesChange: this.invoicesChange,
        valueChange: this.valueChange
      });
    }
  }
} 