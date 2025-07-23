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
        <div>
          <app-button 
            label="New Invoice" 
            icon="pi pi-plus" 
            routerLink="/invoices/new"
          ></app-button>
        </div>
      </div>
      
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          icon="pi-file-invoice"
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
      
      <!-- Placeholder for Charts and Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <app-card 
          class="col-span-3 lg:col-span-2"
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
        
        <app-card
          class="col-span-3 lg:col-span-1"
          title="Quick Actions"
        >
          <div class="space-y-3">
            <div class="flex flex-col gap-3">
              <app-button 
                label="Create New Invoice" 
                icon="pi pi-file"
                routerLink="/invoices/new"
                [fullWidth]="true"
              ></app-button>
              
              <app-button 
                label="Add New Client" 
                icon="pi pi-user"
                routerLink="/clients/new"
                variant="secondary"
                [fullWidth]="true"
              ></app-button>
            </div>
          </div>
        </app-card>
      </div>
    </div>
  `,
  styles: ``
})
export class DashboardComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    // Load dashboard data
  }
} 