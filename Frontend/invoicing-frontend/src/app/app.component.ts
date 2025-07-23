import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MainLayoutComponent],
  template: `<app-main-layout></app-main-layout>`,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Invoicing Application';

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // Force dark mode if needed for testing
    // this.themeService.setTheme(true);
    
    // Ensure dark class is properly applied
    const isDarkMode = this.themeService.isDarkMode();
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    console.log('Dark mode initialized:', isDarkMode);
    console.log('Dark class is applied:', document.documentElement.classList.contains('dark'));
  }
}
