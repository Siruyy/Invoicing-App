import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <!-- Logo and Title - Left aligned -->
          <div class="flex items-center">
            <a routerLink="/" class="text-blue-600 dark:text-primary-400 font-bold text-xl flex items-center">
              <i class="pi pi-file-invoice text-2xl mr-2"></i>
              Invoicing App
            </a>
          </div>
          
          <!-- Main Navigation - Centered -->
          <nav class="flex-1 flex justify-center">
            <ul class="flex space-x-8">
              <li>
                <a 
                  routerLink="/dashboard" 
                  routerLinkActive="text-blue-600 dark:text-primary-400 font-medium border-b-2 border-blue-500 dark:border-primary-500 pb-1" 
                  [routerLinkActiveOptions]="{exact: true}"
                  class="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-primary-400 transition-all"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a 
                  routerLink="/clients" 
                  routerLinkActive="text-blue-600 dark:text-primary-400 font-medium border-b-2 border-blue-500 dark:border-primary-500 pb-1"
                  class="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-primary-400 transition-all"
                >
                  Clients
                </a>
              </li>
              <li>
                <a 
                  routerLink="/invoices" 
                  routerLinkActive="text-blue-600 dark:text-primary-400 font-medium border-b-2 border-blue-500 dark:border-primary-500 pb-1"
                  class="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-primary-400 transition-all"
                >
                  Invoices
                </a>
              </li>
            </ul>
          </nav>
          
          <!-- Right side icons -->
          <div class="flex items-center space-x-4">
            <button 
              class="theme-toggle-btn text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-primary-400 p-2 rounded-full transition-all"
              aria-label="Toggle dark mode"
              (click)="toggleDarkMode()"
            >
              <div class="relative">
                <i class="pi pi-sun text-lg absolute transition-opacity" 
                   [ngClass]="{'opacity-0': !isDarkMode, 'opacity-100': isDarkMode}"></i>
                <i class="pi pi-moon text-lg transition-opacity" 
                   [ngClass]="{'opacity-0': isDarkMode, 'opacity-100': !isDarkMode}"></i>
              </div>
            </button>
            <button 
              class="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-primary-400 p-2 rounded-full transition-all"
              aria-label="User profile"
            >
              <i class="pi pi-user text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: `
    header {
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }
    
    a {
      transition: color 0.3s ease, border-color 0.3s ease;
    }
    
    button {
      transition: color 0.3s ease, background-color 0.3s ease;
    }
    
    .border-b-2 {
      border-bottom-width: 2px;
    }
    
    .theme-toggle-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .theme-toggle-btn i {
      transition: opacity 0.3s ease;
    }
    
    /* Ensure active items have correct text color in light mode */
    a.text-blue-600 {
      color: #2563eb !important;
    }
    
    /* Ensure hover states are consistent */
    a:hover.hover\:text-blue-600 {
      color: #2563eb !important;
    }
  `
})
export class HeaderComponent implements OnInit {
  isDarkMode = false;
  
  constructor(private themeService: ThemeService) {}
  
  ngOnInit() {
    this.themeService.darkMode$.subscribe(isDarkMode => {
      this.isDarkMode = isDarkMode;
    });
  }
  
  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
} 