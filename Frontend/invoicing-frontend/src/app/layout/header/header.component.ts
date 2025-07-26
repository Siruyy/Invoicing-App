import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

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
            
            <div class="relative user-menu-container" *ngIf="isLoggedIn">
              <button 
                class="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-primary-400 p-2 rounded-full transition-all flex items-center"
                (click)="toggleUserMenu($event)"
              >
                <i class="pi pi-user text-lg mr-1"></i>
                <span class="text-sm font-medium">{{ username }}</span>
                <i class="pi pi-chevron-down text-xs ml-1"></i>
              </button>
              
              <div *ngIf="userMenuOpen" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                <div class="py-1">
                  <button 
                    (click)="logout()"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <i class="pi pi-sign-out mr-2"></i> Logout
                  </button>
                </div>
              </div>
            </div>
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
  isLoggedIn = false;
  username: string | null = null;
  userMenuOpen = false;
  
  constructor(
    private themeService: ThemeService, 
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
    
    // Subscribe to auth state
    this.authService.currentUser$.subscribe(username => {
      this.isLoggedIn = !!username;
      this.username = username;
    });
    
    // Close user menu when clicking outside
    document.addEventListener('click', (event: MouseEvent) => {
      // Only close if the menu is open and the click is outside the menu button
      if (this.userMenuOpen && !(event.target as HTMLElement).closest('.user-menu-container')) {
        this.userMenuOpen = false;
      }
    });
  }
  
  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }
  
  toggleUserMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.userMenuOpen = !this.userMenuOpen;
  }
  
  logout(): void {
    this.authService.logout();
    this.userMenuOpen = false;
    this.router.navigate(['/login']);
  }
} 