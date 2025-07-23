import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-white dark:bg-gray-900 shadow border-b border-gray-200 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <!-- Logo and Title -->
          <div class="flex items-center">
            <a routerLink="/" class="text-primary-500 font-bold text-xl flex items-center">
              <i class="pi pi-file-invoice text-2xl mr-2"></i>
              Invoicing App
            </a>
          </div>
          
          <!-- Main Navigation -->
          <nav>
            <ul class="flex space-x-6">
              <li>
                <a 
                  routerLink="/dashboard" 
                  routerLinkActive="text-primary-500 font-medium" 
                  [routerLinkActiveOptions]="{exact: true}"
                  class="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a 
                  routerLink="/clients" 
                  routerLinkActive="text-primary-500 font-medium"
                  class="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
                >
                  Clients
                </a>
              </li>
              <li>
                <a 
                  routerLink="/invoices" 
                  routerLinkActive="text-primary-500 font-medium"
                  class="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
                >
                  Invoices
                </a>
              </li>
            </ul>
          </nav>
          
          <!-- Right side icons -->
          <div class="flex items-center space-x-4">
            <button 
              class="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
              aria-label="Toggle dark mode"
              (click)="toggleDarkMode()"
            >
              <i class="pi" [ngClass]="isDarkMode ? 'pi-sun' : 'pi-moon'" class="text-lg"></i>
            </button>
            <button 
              class="text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
              aria-label="User profile"
            >
              <i class="pi pi-user text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
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