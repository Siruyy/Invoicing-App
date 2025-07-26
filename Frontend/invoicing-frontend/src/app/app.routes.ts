import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  { 
    path: '', 
    redirectTo: '/dashboard', 
    pathMatch: 'full' 
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  // Invoice Management routes
  {
    path: 'invoices',
    loadComponent: () => import('./features/invoices/invoice-list.component').then(m => m.InvoiceListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'invoices/new',
    loadComponent: () => import('./features/invoices/invoice-form.component').then(m => m.InvoiceFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'invoices/:id/edit',
    loadComponent: () => import('./features/invoices/invoice-form.component').then(m => m.InvoiceFormComponent),
    canActivate: [AuthGuard]
  },
  // View route for read-only invoice view
  {
    path: 'invoices/:id/view',
    loadComponent: () => import('./features/invoices/invoice-view.component').then(m => m.InvoiceViewComponent),
    canActivate: [AuthGuard]
  },
  // Redirect /invoices/:id to the view form
  {
    path: 'invoices/:id',
    redirectTo: 'invoices/:id/view',
    pathMatch: 'full'
  },
  // Client Management routes
  {
    path: 'clients',
    loadComponent: () => import('./features/clients/client-list.component').then(m => m.ClientListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'clients/new',
    loadComponent: () => import('./features/clients/client-form.component').then(m => m.ClientFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'clients/:id/edit',
    loadComponent: () => import('./features/clients/client-form.component').then(m => m.ClientFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'clients/:id',
    loadComponent: () => import('./features/clients/client-detail.component').then(m => m.ClientDetailComponent),
    canActivate: [AuthGuard]
  },
  // Wildcard fallback
  { path: '**', redirectTo: '/dashboard' }
];
