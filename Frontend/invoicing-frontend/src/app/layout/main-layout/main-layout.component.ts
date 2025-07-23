import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <!-- Header -->
      <app-header></app-header>
      
      <!-- Main Content -->
      <main class="flex-1 p-6 overflow-auto">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Footer -->
      <app-footer></app-footer>
    </div>
  `,
  styles: `
    div {
      transition: background-color 0.3s ease;
    }
  `
})
export class MainLayoutComponent { } 