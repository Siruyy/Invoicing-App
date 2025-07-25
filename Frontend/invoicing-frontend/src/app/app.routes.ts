import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  // Invoice Management routes
  {
    path: 'invoices',
    loadComponent: () => import('./features/invoices/invoice-list.component').then(m => m.InvoiceListComponent)
  },
  {
    path: 'invoices/new',
    loadComponent: () => import('./features/invoices/invoice-form.component').then(m => m.InvoiceFormComponent)
  },
  {
    path: 'invoices/:id/edit',
    loadComponent: () => import('./features/invoices/invoice-form.component').then(m => m.InvoiceFormComponent)
  },
  // Redirect /invoices/:id to the edit form for simplicity
  {
    path: 'invoices/:id',
    redirectTo: 'invoices/:id/edit',
    pathMatch: 'full'
  },
  // Client Management routes
  {
    path: 'clients',
    loadComponent: () => import('./features/clients/client-list.component').then(m => m.ClientListComponent)
  },
  {
    path: 'clients/new',
    loadComponent: () => import('./features/clients/client-form.component').then(m => m.ClientFormComponent)
  },
  {
    path: 'clients/:id/edit',
    loadComponent: () => import('./features/clients/client-form.component').then(m => m.ClientFormComponent)
  },
  {
    path: 'clients/:id',
    loadComponent: () => import('./features/clients/client-detail.component').then(m => m.ClientDetailComponent)
  },
  // Wildcard fallback
  { path: '**', redirectTo: '/dashboard' }
];
