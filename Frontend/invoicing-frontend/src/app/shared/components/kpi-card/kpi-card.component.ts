import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, CardComponent],
  template: `
    <app-card>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-300">{{ title }}</h3>
          <div class="mt-1 flex items-baseline">
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ prefix }}{{ value | number:format }}{{ suffix }}
            </p>
            
            <p *ngIf="change !== undefined" 
              class="ml-2 flex items-baseline text-sm font-semibold"
              [ngClass]="{
                'text-green-600 dark:text-green-400': change > 0,
                'text-red-600 dark:text-red-400': change < 0,
                'text-gray-500 dark:text-gray-400': change === 0
              }"
            >
              <span class="flex items-center">
                <i *ngIf="change > 0" class="pi pi-arrow-up mr-1"></i>
                <i *ngIf="change < 0" class="pi pi-arrow-down mr-1"></i>
                {{ change > 0 ? '+' : '' }}{{ change | number:'1.1-1' }}%
              </span>
            </p>
          </div>
          <p *ngIf="subtitle" class="mt-1 text-sm text-gray-500 dark:text-gray-300">{{ subtitle }}</p>
        </div>
        
        <div *ngIf="icon" class="rounded-md bg-primary-50 dark:bg-primary-900/40 p-3 flex items-center justify-center">
          <i [class]="'pi ' + icon + ' text-primary-600 dark:text-primary-300 text-xl'"></i>
        </div>
      </div>
    </app-card>
  `,
  styles: ``
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
} 