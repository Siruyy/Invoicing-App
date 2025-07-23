import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="h-full border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg transition-colors">
      <div class="p-4">
        <!-- Sidebar Navigation -->
        <nav class="mt-4">
          <ul class="space-y-2">
            <li>
              <a 
                routerLink="/dashboard" 
                routerLinkActive="bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium border-l-4 border-primary-500 dark:border-primary-400"
                [routerLinkActiveOptions]="{exact: true}"
                class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <i class="pi pi-home text-lg mr-3"></i>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a 
                routerLink="/clients" 
                routerLinkActive="bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium border-l-4 border-primary-500 dark:border-primary-400"
                class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <i class="pi pi-users text-lg mr-3"></i>
                <span>Clients</span>
              </a>
            </li>
            <li>
              <a 
                routerLink="/invoices" 
                routerLinkActive="bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-medium border-l-4 border-primary-500 dark:border-primary-400"
                class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <i class="pi pi-file-invoice text-lg mr-3"></i>
                <span>Invoices</span>
              </a>
            </li>
          </ul>
        </nav>
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
    
    a.border-l-4 {
      border-left-width: 4px;
    }
    
    /* Ensure active items have correct text color in light mode */
    a.text-primary-600 {
      color: #3b82f6 !important;
    }
  `
})
export class SidebarComponent { } 