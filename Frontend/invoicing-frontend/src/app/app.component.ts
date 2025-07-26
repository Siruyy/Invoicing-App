import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { ThemeService } from './core/services/theme.service';
import { AiChatComponent } from './shared/components/ai-chat/ai-chat.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MainLayoutComponent, AiChatComponent],
  template: `
    <app-main-layout *ngIf="!isLoginPage"></app-main-layout>
    <router-outlet *ngIf="isLoginPage"></router-outlet>
    <app-ai-chat *ngIf="!isLoginPage"></app-ai-chat>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Invoicing Application';
  isLoginPage = false;

  constructor(
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit() {
    // Check current route on init
    this.isLoginPage = this.router.url === '/login';
    
    // Listen for route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLoginPage = event.url === '/login';
    });
    
    // Ensure dark class is properly applied
    const isDarkMode = this.themeService.isDarkMode();
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }
}
