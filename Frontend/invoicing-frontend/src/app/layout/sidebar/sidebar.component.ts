import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="w-64 bg-white dark:bg-gray-900 shadow-lg h-full border-r border-gray-200 dark:border-gray-800 transition-colors">
      <div class="p-4">
        <!-- Sidebar Navigation -->
        <nav class="mt-4">
          <ul class="space-y-2">
            <li>
              <a 
                routerLink="/dashboard" 
                routerLinkActive="bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium"
                [routerLinkActiveOptions]="{exact: true}"
                class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <i class="pi pi-home text-lg mr-3"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a 
                routerLink="/clients" 
                routerLinkActive="bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium"
                class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <i class="pi pi-users text-lg mr-3"></i>
                <span>Clients</span>
              </a>
            </li>
            <li>
              <a 
                routerLink="/invoices" 
                routerLinkActive="bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium"
                class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <i class="pi pi-file-invoice text-lg mr-3"></i>
                <span>Invoices</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <!-- Quick Actions -->
        <div class="mt-8">
          <h3 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 mb-2">
            Quick Actions
          </h3>
          <div class="mt-2 space-y-2">
            <a 
              routerLink="/invoices/new" 
              class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <i class="pi pi-plus text-lg mr-3"></i>
              <span>New Invoice</span>
            </a>
            <a 
              routerLink="/clients/new" 
              class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <i class="pi pi-plus text-lg mr-3"></i>
              <span>New Client</span>
            </a>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: `
    aside {
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }
    
    a {
      transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
    }
  `
})
export class SidebarComponent { } 