import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(this.getInitialThemeState());
  darkMode$ = this.darkMode.asObservable();
  
  constructor() {
    // Initialize theme from local storage or system preference
    this.setTheme(this.darkMode.value);
  }
  
  toggleDarkMode(): void {
    this.setTheme(!this.darkMode.value);
  }
  
  setTheme(isDarkMode: boolean): void {
    // Update UI by adding/removing class from document root element (html)
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Update state and save preference
    this.darkMode.next(isDarkMode);
    localStorage.setItem('darkMode', String(isDarkMode));
  }
  
  private getInitialThemeState(): boolean {
    // Check if user has a preference stored
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    
    // Otherwise, check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  // Helper method to check current mode
  isDarkMode(): boolean {
    return this.darkMode.value;
  }
} 