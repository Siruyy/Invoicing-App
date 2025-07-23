import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all shadow-md hover:shadow-lg dark:shadow-lg"
      [ngClass]="{'p-3': !noPadding}"
    >
      <div *ngIf="title || subtitle" class="mb-3">
        <h2 *ngIf="title" class="text-lg font-medium text-gray-900 dark:text-white">
          {{ title }}
        </h2>
        <p *ngIf="subtitle" class="text-sm text-gray-500 dark:text-gray-400">
          {{ subtitle }}
        </p>
      </div>
      
      <ng-content></ng-content>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    
    div {
      transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
    
    /* Ensure all inner content follows dark mode */
    :host ::ng-deep .dark div, 
    :host ::ng-deep .dark section,
    :host ::ng-deep .dark article {
      background-color: #1e1e1e !important;
    }
  `
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() noPadding = false;
} 