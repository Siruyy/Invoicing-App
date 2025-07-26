import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <app-card>
      <div *ngIf="loading" class="flex items-center justify-center h-full">
        <div class="animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 w-20 mb-4 rounded"></div>
          <div class="h-8 bg-gray-200 dark:bg-gray-700 w-32 mb-2 rounded"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 w-24 rounded"></div>
        </div>
      </div>
      <div *ngIf="!loading" class="bg-transparent dark:bg-transparent kpi-card-content">
        <!-- Top section with icon on left, title on right -->
        <div class="flex items-center justify-between mb-2 bg-transparent dark:bg-transparent">
          <div *ngIf="icon" class="rounded-md bg-blue-50 dark:bg-primary-900/40 p-2 flex items-center justify-center">
            <i [class]="'pi ' + icon + ' text-blue-600 dark:text-primary-300 text-xl'"></i>
          </div>
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-300">{{ title }}</h3>
        </div>
        
        <!-- Value section - centered and 25% larger -->
        <div class="flex flex-col items-center bg-transparent dark:bg-transparent my-2">
          <p class="text-4xl font-bold text-gray-900 dark:text-white">
            {{ prefix }}{{ value | number:format }}{{ suffix }}
          </p>
          
          <!-- Change and subtitle -->
          <div class="flex items-center mt-1">
            <span *ngIf="change !== undefined" class="text-sm font-semibold mr-2" [class.positive-change]="change > 0" [class.negative-change]="change < 0" [class.neutral-change]="change === 0">
              <i *ngIf="change > 0" class="pi pi-arrow-up mr-1"></i>
              <i *ngIf="change < 0" class="pi pi-arrow-down mr-1"></i>
              {{ change > 0 ? '+' : '' }}{{ change | number:'1.1-1' }}%
            </span>
            <p *ngIf="subtitle" class="text-sm text-gray-500 dark:text-gray-300">{{ subtitle }}</p>
          </div>
        </div>
      </div>
    </app-card>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    :host ::ng-deep app-card {
      height: 100%;
    }
    
    :host ::ng-deep app-card > div {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    
    .kpi-card-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    :host ::ng-deep .dark p,
    :host ::ng-deep .dark div,
    :host ::ng-deep .dark span {
      background-color: transparent !important;
    }
    
    :host ::ng-deep h3, 
    :host ::ng-deep p, 
    :host ::ng-deep div,
    :host ::ng-deep span {
      background-color: transparent;
    }
    
    .positive-change {
      color: #16a34a !important; /* green-600 */
    }
    
    .negative-change {
      color: #dc2626 !important; /* red-600 */
    }
    
    .neutral-change {
      color: #6b7280 !important; /* gray-500 */
    }
    
    .dark .positive-change {
      color: #4ade80 !important; /* green-400 */
    }
    
    .dark .negative-change {
      color: #f87171 !important; /* red-400 */
    }
    
    .dark .neutral-change {
      color: #9ca3af !important; /* gray-400 */
    }
  `
})
export class KpiCardComponent {
  @Input() title = '';
  @Input() value: number = 0;
  @Input() prefix = '';
  @Input() suffix = '';
  @Input() format = '1.0-0'; // Default number format
  @Input() icon = '';
  @Input() change?: number; // Percentage change (up or down)
  @Input() subtitle = '';
  @Input() loading = false;
} 