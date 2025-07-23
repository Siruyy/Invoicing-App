import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  // Placeholder routes - will be implemented later
  { path: 'clients', redirectTo: '/dashboard' },
  { path: 'clients/new', redirectTo: '/dashboard' },
  { path: 'clients/:id', redirectTo: '/dashboard' },
  { path: 'clients/:id/edit', redirectTo: '/dashboard' },
  { path: 'invoices', redirectTo: '/dashboard' },
  { path: 'invoices/new', redirectTo: '/dashboard' },
  { path: 'invoices/:id', redirectTo: '/dashboard' },
  { path: 'invoices/:id/edit', redirectTo: '/dashboard' },
  { path: '**', redirectTo: '/dashboard' }
];
