import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <div class="w-full max-w-md m-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-500 p-8 transition-colors">
        <h2 class="text-2xl font-bold text-center text-gray-800 dark:text-white mb-8">Admin Login</h2>
        
        <div *ngIf="errorMessage" class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          {{ errorMessage }}
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="mb-6">
            <label for="username" class="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">Username</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              [ngClass]="{'border-red-500 dark:border-red-700': submitted && f['username'].errors}">
            <div *ngIf="submitted && f['username'].errors" class="text-red-500 dark:text-red-400 text-xs mt-1">
              <div *ngIf="f['username'].errors['required']">Username is required</div>
            </div>
          </div>
          
          <div class="mb-6">
            <label for="password" class="block text-gray-700 dark:text-gray-200 text-sm font-semibold mb-2">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              [ngClass]="{'border-red-500 dark:border-red-700': submitted && f['password'].errors}">
            <div *ngIf="submitted && f['password'].errors" class="text-red-500 dark:text-red-400 text-xs mt-1">
              <div *ngIf="f['password'].errors['required']">Password is required</div>
            </div>
          </div>
          
          <div class="mb-6 flex items-center">
            <input 
              type="checkbox" 
              id="rememberMe" 
              formControlName="rememberMe"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded">
            <label for="rememberMe" class="ml-2 block text-gray-700 dark:text-gray-300 text-sm">Remember me</label>
          </div>
          
          <div class="mb-6">
            <button 
              type="submit" 
              class="w-full login-btn-custom py-2 px-4 rounded-md transition-colors shadow border"
              [disabled]="loading">
              <span *ngIf="loading" class="inline-block animate-spin mr-2">⟳</span>
              {{ loading ? 'Logging in...' : 'Login' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
    .login-btn-custom {
      background: #2563eb !important;
      color: #fff !important;
      border: 1px solid #2563eb !important;
      font-weight: 600;
      box-shadow: 0 2px 8px 0 rgba(37,99,235,0.10);
    }
    .login-btn-custom:hover, .login-btn-custom:focus {
      background: #1d4ed8 !important;
      border-color: #1d4ed8 !important;
    }
    .dark .login-btn-custom {
      background: #2563eb !important;
      border-color: #2563eb !important;
      color: #fff !important;
    }
    .dark .login-btn-custom:hover, .dark .login-btn-custom:focus {
      background: #1e40af !important;
      border-color: #1e40af !important;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  isDarkMode = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }
  
  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeService.darkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });
  }
  
  // Convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }
  
  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    
    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    this.authService.login({
      username: this.f['username'].value,
      password: this.f['password'].value,
      rememberMe: this.f['rememberMe'].value
    }).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: error => {
        this.errorMessage = error.message || 'Invalid username or password';
        this.loading = false;
      }
    });
  }
}
