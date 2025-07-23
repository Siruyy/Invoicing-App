import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Shared Components
import { CardComponent } from '../../shared/components/card/card.component';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

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
          [value]="125000"
          prefix="$"
          icon="pi-dollar"
          [change]="8.2"
          subtitle="Last 30 days"
        ></app-kpi-card>
        
        <app-kpi-card
          title="Outstanding Amount"
          [value]="45750"
          prefix="$"
          icon="pi-credit-card"
          [change]="-2.5"
          subtitle="10 unpaid invoices"
        ></app-kpi-card>
        
        <app-kpi-card
          title="Invoices Created"
          [value]="24"
          icon="pi-file"
          [change]="12"
          subtitle="Last 30 days"
        ></app-kpi-card>
        
        <app-kpi-card
          title="Average Value"
          [value]="5208"
          prefix="$"
          format="1.0-0"
          icon="pi-chart-bar"
          [change]="3.1"
          subtitle="Per invoice"
        ></app-kpi-card>
      </div>
      
      <!-- Placeholder for future chart implementation -->
      <div class="mb-8">
        <app-card>
          <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4 pl-2">Monthly Revenue</h2>
          <div class="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-700 rounded-md">
            <p class="text-gray-500 dark:text-gray-400">Chart will be implemented later</p>
          </div>
        </app-card>
      </div>
      
      <!-- Recent Invoices -->
      <app-card 
        title="Recent Invoices"
        subtitle="Last 5 invoices created"
      >
        <div class="text-center py-16 text-gray-500 dark:text-gray-400">
          <p class="mb-4">Invoice history will be displayed here</p>
          <app-button 
            label="View All Invoices" 
            variant="secondary"
            routerLink="/invoices"
          ></app-button>
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
  constructor() { }

  ngOnInit(): void {
    // Initialization logic
  }
} 